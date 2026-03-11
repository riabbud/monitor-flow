require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/users');
const serverRoutes = require('./routes/servers');
const technologyRoutes = require('./routes/technologies');
const analyticsRoutes = require('./routes/analytics');
const companyRoutes = require('./routes/companies');
const accessProfileRoutes = require('./routes/accessProfiles');

// Middleware
const authMiddleware = require('./middleware/auth');

// Worker
const { startMonitor, setSocketIO } = require('./workers/monitor');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:9000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:9000',
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/technologies', technologyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/access-profiles', accessProfileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Socket.io authentication and room management
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Token não fornecido.'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('Token inválido.'));
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId}`);

    // Join user-specific room for targeted updates
    socket.join(socket.userId);

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.userId}`);
    });
});

// Set Socket.io in monitor worker
setSocketIO(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║         🔄 Monitor-Flow Server           ║');
    console.log('  ╠══════════════════════════════════════════╣');
    console.log(`  ║  🌐 API:    http://localhost:${PORT}         ║`);
    console.log(`  ║  🔌 Socket: ws://localhost:${PORT}          ║`);
    console.log('  ║  📊 Status: Running                      ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');

    // Start monitoring worker
    startMonitor();
});

module.exports = { app, server, io };
