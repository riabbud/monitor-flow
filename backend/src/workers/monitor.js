const axios = require('axios');
const http = require('http');
const https = require('https');
const dns = require('dns');
const prisma = require('../config/database');

let io = null;

// Agent HTTPS/HTTP que ignora erros de certificado e contorna timeout de CGNAT/Docker para a Cloudflare
const customLookup = (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err);
        
        // Trata a resposta se options.all === true (array de objetos) ou false/undefined (string)
        if (Array.isArray(address)) {
            const isCloudflare = address.some(a => a.address && (a.address.startsWith('104.') || a.address.startsWith('172.67.')));
            if (isCloudflare) {
                return callback(null, [{ address: '1.1.1.1', family: 4 }]);
            }
        } else if (typeof address === 'string') {
            if (address.startsWith('104.') || address.startsWith('172.67.')) {
                return callback(null, '1.1.1.1', 4);
            }
        }
        
        callback(null, address, family);
    });
};

const httpsAgent = new https.Agent({ 
    rejectUnauthorized: false,
    lookup: customLookup 
});

const httpAgent = new http.Agent({ 
    lookup: customLookup 
});

/**
 * Set the Socket.io instance for real-time updates
 */
function setSocketIO(socketIO) {
    io = socketIO;
}

/**
 * Check a single application URL
 * Não segue redirects para evitar loops (ex: Oracle APEX + Cloudflare).
 * Qualquer resposta com status < 500 (incluindo 3xx) indica que o servidor está online.
 *
 * @param {Object} app - Application record
 * @returns {Object} Updated status data
 */
async function checkApplication(app) {
    const startTime = Date.now();
    let status = 'offline';
    let responseTime = null;

    try {
        const response = await axios.get(app.url, {
            timeout: 15000,
            maxRedirects: 0,
            validateStatus: (s) => s < 500,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            httpsAgent,
            httpAgent,
        });

        responseTime = Date.now() - startTime;
        status = 'online';
    } catch (error) {
        responseTime = Date.now() - startTime;

        // Redirects (3xx) retornam erro com maxRedirects: 0,
        // mas se o servidor respondeu, ele está online
        if (error.response && error.response.status < 500) {
            status = 'online';
        } else {
            status = 'offline';
        }
    }

    return { status, responseTime, lastChecked: new Date() };
}

/**
 * Run the monitoring cycle for all applications
 */
async function runMonitoringCycle() {
    try {
        const now = new Date();
        const applications = await prisma.application.findMany({
            include: { user: { select: { id: true } } },
        });

        if (applications.length === 0) return;

        const toCheck = applications.filter(app => {
            if (!app.lastChecked) return true;
            const diffSeconds = (now - new Date(app.lastChecked)) / 1000;
            return diffSeconds >= (app.checkInterval || 60);
        });

        if (toCheck.length === 0) return;

        console.log(`[Monitor] Checking ${toCheck.length} application(s)...`);

        const checkPromises = toCheck.map(async (app) => {
            const oldStatus = app.status;
            const result = await checkApplication(app);

            // Update database
            const [updated] = await Promise.all([
                prisma.application.update({
                    where: { id: app.id },
                    data: {
                        status: result.status,
                        responseTime: result.responseTime,
                        lastChecked: result.lastChecked,
                    },
                }),
                prisma.applicationLog.create({
                    data: {
                        applicationId: app.id,
                        status: result.status,
                        responseTime: result.responseTime,
                    },
                }),
            ]);

            // Emit real-time update if status changed or on every check
            if (io) {
                io.to(app.userId).emit('application:statusUpdate', updated);

                // Emit special event on status change
                if (oldStatus !== result.status) {
                    io.to(app.userId).emit('application:statusChanged', {
                        id: app.id,
                        name: app.name,
                        oldStatus,
                        newStatus: result.status,
                    });
                    console.log(
                        `[Monitor] ${app.name}: ${oldStatus} → ${result.status} (${result.responseTime}ms)`
                    );
                }
            }

            return updated;
        });

        await Promise.allSettled(checkPromises);
    } catch (error) {
        console.error('[Monitor] Error in monitoring cycle:', error);
    }
}

/**
 * Start the monitoring worker
 */
function startMonitor() {
    // The global worker loop runs every 10 seconds to allow granularity
    const interval = parseInt(process.env.MONITOR_INTERVAL, 10) || 10000;

    console.log(
        `[Monitor] Starting worker - check cycle every ${interval / 1000}s`
    );

    // Run immediately on start
    runMonitoringCycle();

    // Then repeat at interval
    setInterval(runMonitoringCycle, interval);
}

module.exports = { startMonitor, setSocketIO, runMonitoringCycle };
