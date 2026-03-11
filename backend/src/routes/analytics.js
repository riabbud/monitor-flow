const express = require('express');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { buildCompanyFilter } = require('../utils/companyFilter');

const router = express.Router();

router.use(authMiddleware);

// GET /api/analytics/drops
router.get('/drops', async (req, res) => {
    try {
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        const drops = await prisma.applicationLog.groupBy({
            by: ['applicationId'],
            where: {
                status: 'offline',
                application: companyFilter,
                createdAt: {
                    ...(req.query.startDate && { gte: new Date(`${req.query.startDate}T00:00:00.000`) }),
                    ...(req.query.endDate && { lte: new Date(`${req.query.endDate}T23:59:59.999`) })
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 10
        });

        const appIds = drops.map(d => d.applicationId);
        const apps = await prisma.application.findMany({
            where: { id: { in: appIds } },
            select: { id: true, name: true }
        });

        const appsMap = apps.reduce((acc, app) => {
            acc[app.id] = app.name;
            return acc;
        }, {});

        const result = drops.map(d => ({
            name: appsMap[d.applicationId] || 'Desconhecido',
            dropsCount: d._count.id
        }));

        res.json(result);
    } catch (error) {
        console.error('Analytics drops error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/drops-by-day
router.get('/drops-by-day', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        let start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        if (startDate) {
            start = new Date(`${startDate}T00:00:00.000`);
        }

        let end = new Date();
        if (endDate) {
            end = new Date(`${endDate}T23:59:59.999`);
        }

        const logs = await prisma.applicationLog.findMany({
            where: {
                status: 'offline',
                createdAt: {
                    gte: start,
                    lte: end
                },
                application: companyFilter
            },
            include: {
                application: {
                    select: { id: true, name: true }
                }
            }
        });

        const dropsByDayAndApp = {};

        logs.forEach(log => {
            const dateStr = log.createdAt.toISOString().split('T')[0];
            const appName = log.application.name;

            if (!dropsByDayAndApp[dateStr]) {
                dropsByDayAndApp[dateStr] = {};
            }
            if (!dropsByDayAndApp[dateStr][appName]) {
                dropsByDayAndApp[dateStr][appName] = 0;
            }
            dropsByDayAndApp[dateStr][appName]++;
        });

        const dates = [];
        let currentDate = new Date(start);
        const loopEnd = new Date(end);

        while (currentDate <= loopEnd) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const allApps = new Set();
        const userApps = await prisma.application.findMany({ select: { name: true }, where: companyFilter });
        userApps.forEach(a => allApps.add(a.name));

        const series = [];
        allApps.forEach(appName => {
            const data = dates.map(date => {
                return (dropsByDayAndApp[date] && dropsByDayAndApp[date][appName]) || 0;
            });
            series.push({
                name: appName,
                data
            });
        });

        res.json({ dates, series });
    } catch (error) {
        console.error('Analytics drops by day error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        let logDateFilter = {};

        if (startDate || endDate) {
            logDateFilter = {
                ...(startDate && { gte: new Date(`${startDate}T00:00:00.000`) }),
                ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) })
            };
        }

        const apps = await prisma.application.findMany({
            where: companyFilter
        });

        // Group by application and status
        const logStats = await prisma.applicationLog.groupBy({
            by: ['applicationId', 'status'],
            where: {
                application: companyFilter,
                ...(Object.keys(logDateFilter).length > 0 ? { createdAt: logDateFilter } : {})
            },
            _avg: { responseTime: true },
            _count: { id: true }
        });

        const appStats = {};
        apps.forEach(a => {
            appStats[a.id] = { avgResponseTime: 0, onlineCount: 0, offlineCount: 0, name: a.name, techStack: a.techStack };
        });

        logStats.forEach(stat => {
            if (appStats[stat.applicationId]) {
                if (stat.status === 'online') {
                    appStats[stat.applicationId].onlineCount = stat._count.id;
                    appStats[stat.applicationId].avgResponseTime = stat._avg.responseTime || 0;
                } else if (stat.status === 'offline') {
                    appStats[stat.applicationId].offlineCount = stat._count.id;
                }
            }
        });

        let onlineCount = 0;
        let offlineCount = 0;
        let slowCount = 0;
        let noDataCount = 0;

        const processedApps = Object.values(appStats).map(app => {
            const total = app.onlineCount + app.offlineCount;
            let status = 'no_data';

            if (total > 0) {
                if (app.offlineCount > 0 && app.offlineCount > app.onlineCount * 0.1) {
                    status = 'offline';
                } else if (app.avgResponseTime >= 500) {
                    status = 'slow';
                } else {
                    status = 'online';
                }
            }

            if (status === 'online') onlineCount++;
            if (status === 'offline') offlineCount++;
            if (status === 'slow') slowCount++;
            if (status === 'no_data') noDataCount++;

            return {
                name: app.name,
                techStack: app.techStack,
                status,
                responseTime: Math.round(app.avgResponseTime || 0)
            };
        });

        let sumResponse = 0;
        let responseCount = 0;
        processedApps.forEach(app => {
            if (app.responseTime > 0) {
                sumResponse += app.responseTime;
                responseCount++;
            }
        });
        const globalAvgResponseTime = responseCount > 0 ? Math.round(sumResponse / responseCount) : 0;

        res.json({
            appsCount: apps.length,
            onlineCount,
            offlineCount,
            slowCount,
            noDataCount,
            globalAvgResponseTime,
            processedApps
        });
    } catch (error) {
        console.error('Analytics dashboard error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/total-drops
router.get('/total-drops', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        const total = await prisma.applicationLog.count({
            where: {
                status: 'offline',
                application: companyFilter,
                createdAt: {
                    ...(startDate && { gte: new Date(`${startDate}T00:00:00.000`) }),
                    ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) })
                }
            }
        });
        res.json({ total });
    } catch (error) {
        console.error('Analytics total drops error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/total-online-pings
router.get('/total-online-pings', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        const total = await prisma.applicationLog.count({
            where: {
                status: 'online',
                application: companyFilter,
                createdAt: {
                    ...(startDate && { gte: new Date(`${startDate}T00:00:00.000`) }),
                    ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) })
                }
            }
        });
        res.json({ total });
    } catch (error) {
        console.error('Analytics total online pings error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/total-slow-pings
router.get('/total-slow-pings', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        const total = await prisma.applicationLog.count({
            where: {
                status: 'online',
                responseTime: { gte: 500 },
                application: companyFilter,
                createdAt: {
                    ...(startDate && { gte: new Date(`${startDate}T00:00:00.000`) }),
                    ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) })
                }
            }
        });
        res.json({ total });
    } catch (error) {
        console.error('Analytics total slow pings error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/analytics/advanced
router.get('/advanced', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyFilter = await buildCompanyFilter(req.user, req.query.companyId);

        let start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        if (startDate) start = new Date(`${startDate}T00:00:00.000`);

        let end = new Date();
        if (endDate) end = new Date(`${endDate}T23:59:59.999`);

        const logs = await prisma.applicationLog.findMany({
            where: {
                application: companyFilter,
                createdAt: { gte: start, lte: end }
            },
            include: {
                application: {
                    select: { id: true, name: true, server: { select: { name: true } } }
                }
            }
        });

        const responseTimeByDayAndApp = {};
        const datesSet = new Set();
        const appCounts = {};
        const dropsByServer = {};
        const dropsByHour = Array(24).fill(0);
        const pingHistogram = {
            '0-100ms': 0,
            '100-300ms': 0,
            '300-600ms': 0,
            '600ms+': 0
        };

        logs.forEach(log => {
            const dateStr = log.createdAt.toISOString().split('T')[0];
            datesSet.add(dateStr);
            const appName = log.application.name;
            const appId = log.applicationId;

            if (!appCounts[appId]) appCounts[appId] = { name: appName, total: 0, online: 0 };
            appCounts[appId].total++;
            if (log.status === 'online') appCounts[appId].online++;

            if (log.status === 'offline') {
                if (log.application.server) {
                    const serverName = log.application.server.name;
                    dropsByServer[serverName] = (dropsByServer[serverName] || 0) + 1;
                }
                const hour = log.createdAt.getHours();
                dropsByHour[hour]++;
            }

            if (log.status === 'online' && log.responseTime !== null) {
                if (log.responseTime <= 100) pingHistogram['0-100ms']++;
                else if (log.responseTime <= 300) pingHistogram['100-300ms']++;
                else if (log.responseTime <= 600) pingHistogram['300-600ms']++;
                else pingHistogram['600ms+']++;

                if (!responseTimeByDayAndApp[dateStr]) responseTimeByDayAndApp[dateStr] = { total: 0, count: 0 };
                responseTimeByDayAndApp[dateStr].total += log.responseTime;
                responseTimeByDayAndApp[dateStr].count++;
            }
        });

        const dates = Array.from(datesSet).sort();
        const responseTimeHistory = dates.map(date => {
            const data = responseTimeByDayAndApp[date];
            return data && data.count > 0 ? Math.round(data.total / data.count) : 0;
        });

        const uptime = Object.values(appCounts).map(app => {
            return {
                name: app.name,
                uptimePercentage: app.total > 0 ? Number(((app.online / app.total) * 100).toFixed(2)) : 0
            };
        });

        const serverDropsData = Object.keys(dropsByServer).map(serverName => ({
            name: serverName,
            drops: dropsByServer[serverName]
        }));

        res.json({
            responseTimeHistory: { dates, series: [{ name: 'Média Global (ms)', data: responseTimeHistory }] },
            uptime: uptime.sort((a, b) => a.uptimePercentage - b.uptimePercentage),
            dropsByServer: serverDropsData,
            dropsByHour,
            pingHistogram: Object.keys(pingHistogram).map(k => ({ name: k, count: pingHistogram[k] }))
        });

    } catch (error) {
        console.error('Analytics advanced error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
