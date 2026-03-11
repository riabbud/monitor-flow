const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { buildCompanyFilter } = require('../utils/companyFilter');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================
// GET /api/applications
// ============================
router.get('/', async (req, res) => {
    try {
        const whereClause = await buildCompanyFilter(req.user, req.query.companyId);

        const applications = await prisma.application.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { server: true }
        });

        res.json(applications);
    } catch (error) {
        console.error('List applications error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/applications/:id
// ============================
router.get('/:id', async (req, res) => {
    try {
        const userFilter = await buildCompanyFilter(req.user, req.query.companyId);
        
        const application = await prisma.application.findFirst({
            where: {
                id: req.params.id,
                ...userFilter
            },
            include: { server: true }
        });

        if (!application) {
            return res.status(404).json({ error: 'Aplicação não encontrada.' });
        }

        res.json(application);
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/applications
// ============================
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('url').isURL().withMessage('URL inválida.'),
        body('techStack').notEmpty().withMessage('Tecnologia é obrigatória.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, url, techStack, serverId, checkInterval } = req.body;

            const application = await prisma.application.create({
                data: {
                    name,
                    url,
                    techStack,
                    checkInterval: parseInt(checkInterval, 10) || 60,
                    serverId: serverId || null,
                    userId: req.user.id,
                    status: 'offline',
                },
                include: { server: true },
            });

            // Emit to socket for immediate feedback
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('application:created', application);
            }

            res.status(201).json(application);
        } catch (error) {
            console.error('Create application error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// PUT /api/applications/:id
// ============================
router.put(
    '/:id',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('url').isURL().withMessage('URL inválida.'),
        body('techStack').notEmpty().withMessage('Tecnologia é obrigatória.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify ownership via company filter
            const userFilter = await buildCompanyFilter(req.user, req.query.companyId);
            const existing = await prisma.application.findFirst({
                where: { 
                    id: req.params.id, 
                    ...userFilter 
                },
            });

            if (!existing) {
                return res.status(404).json({ error: 'Aplicação não encontrada.' });
            }

            const { name, url, techStack, serverId, checkInterval } = req.body;

            const application = await prisma.application.update({
                where: { id: req.params.id },
                data: { name, url, techStack, serverId: serverId || null, checkInterval: parseInt(checkInterval, 10) || 60 },
                include: { server: true },
            });

            // Emit update
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('application:updated', application);
            }

            res.json(application);
        } catch (error) {
            console.error('Update application error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// GET /api/applications/logs/offline
// ============================
router.get('/logs/offline', async (req, res) => {
    try {
        const userFilter = await buildCompanyFilter(req.user, req.query.companyId);

        const logs = await prisma.applicationLog.findMany({
            where: {
                status: 'offline',
                application: userFilter
            },
            include: {
                application: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        res.json(logs);
    } catch (error) {
        console.error('Get recent drops error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// DELETE /api/applications/:id
// ============================
router.delete('/:id', async (req, res) => {
    try {
        // Verify ownership via company filter
        const userFilter = await buildCompanyFilter(req.user, req.query.companyId);
        const existing = await prisma.application.findFirst({
            where: { 
                id: req.params.id, 
                ...userFilter 
            },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Aplicação não encontrada.' });
        }

        await prisma.application.delete({
            where: { id: req.params.id },
        });

        // Emit delete
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id).emit('application:deleted', { id: req.params.id });
        }

        res.json({ message: 'Aplicação removida com sucesso.' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/applications/:id/logs
// ============================
router.get('/:id/logs', async (req, res) => {
    try {
        // Verify ownership via company filter
        const userFilter = await buildCompanyFilter(req.user, req.query.companyId);
        
        const app = await prisma.application.findFirst({
            where: { 
                id: req.params.id,
                ...userFilter
            },
        });

        if (!app) {
            return res.status(404).json({ error: 'Aplicação não encontrada.' });
        }

        const logs = await prisma.applicationLog.findMany({
            where: { applicationId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 logs
        });

        res.json(logs);
    } catch (error) {
        console.error('Get application logs error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
