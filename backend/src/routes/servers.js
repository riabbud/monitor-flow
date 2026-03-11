const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { buildCompanyFilter } = require('../utils/companyFilter');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================
// GET /api/servers
// ============================
router.get('/', async (req, res) => {
    try {
        const whereClause = await buildCompanyFilter(req.user, req.query.companyId);

        const servers = await prisma.server.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { applications: true }
        });

        res.json(servers);
    } catch (error) {
        console.error('List servers error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/servers/:id
// ============================
router.get('/:id', async (req, res) => {
    try {
        const server = await prisma.server.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
            include: { applications: true }
        });

        if (!server) {
            return res.status(404).json({ error: 'Servidor não encontrado.' });
        }

        res.json(server);
    } catch (error) {
        console.error('Get server error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/servers
// ============================
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, accessAccount, ipAddress, description } = req.body;

            const server = await prisma.server.create({
                data: {
                    name,
                    accessAccount,
                    ipAddress,
                    description,
                    userId: req.user.id,
                },
            });

            // Emit to socket for immediate feedback
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('server:created', server);
            }

            res.status(201).json(server);
        } catch (error) {
            console.error('Create server error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// PUT /api/servers/:id
// ============================
router.put(
    '/:id',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify ownership
            const existing = await prisma.server.findFirst({
                where: { id: req.params.id, userId: req.user.id },
            });

            if (!existing) {
                return res.status(404).json({ error: 'Servidor não encontrado.' });
            }

            const { name, accessAccount, ipAddress, description } = req.body;

            const server = await prisma.server.update({
                where: { id: req.params.id },
                data: { name, accessAccount, ipAddress, description },
            });

            // Emit update
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('server:updated', server);
            }

            res.json(server);
        } catch (error) {
            console.error('Update server error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// DELETE /api/servers/:id
// ============================
router.delete('/:id', async (req, res) => {
    try {
        // Verify ownership
        const existing = await prisma.server.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Servidor não encontrado.' });
        }

        await prisma.server.delete({
            where: { id: req.params.id },
        });

        // Emit delete
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id).emit('server:deleted', { id: req.params.id });
        }

        res.json({ message: 'Servidor removido com sucesso.' });
    } catch (error) {
        console.error('Delete server error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
