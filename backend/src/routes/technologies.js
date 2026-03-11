const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { buildCompanyFilter } = require('../utils/companyFilter');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================
// GET /api/technologies
// ============================
router.get('/', async (req, res) => {
    try {
        const whereClause = await buildCompanyFilter(req.user, req.query.companyId);

        const technologies = await prisma.technology.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        res.json(technologies);
    } catch (error) {
        console.error('List technologies error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/technologies/:id
// ============================
router.get('/:id', async (req, res) => {
    try {
        const technology = await prisma.technology.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
        });

        if (!technology) {
            return res.status(404).json({ error: 'Tecnologia não encontrada.' });
        }

        res.json(technology);
    } catch (error) {
        console.error('Get technology error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/technologies
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

            const { name, type } = req.body;

            const technology = await prisma.technology.create({
                data: {
                    name,
                    type,
                    userId: req.user.id,
                },
            });

            // Emit to socket for immediate feedback
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('technology:created', technology);
            }

            res.status(201).json(technology);
        } catch (error) {
            console.error('Create technology error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// PUT /api/technologies/:id
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
            const existing = await prisma.technology.findFirst({
                where: { id: req.params.id, userId: req.user.id },
            });

            if (!existing) {
                return res.status(404).json({ error: 'Tecnologia não encontrada.' });
            }

            const { name, type } = req.body;

            const technology = await prisma.technology.update({
                where: { id: req.params.id },
                data: { name, type },
            });

            // Emit update
            const io = req.app.get('io');
            if (io) {
                io.to(req.user.id).emit('technology:updated', technology);
            }

            res.json(technology);
        } catch (error) {
            console.error('Update technology error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// DELETE /api/technologies/:id
// ============================
router.delete('/:id', async (req, res) => {
    try {
        // Verify ownership
        const existing = await prisma.technology.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Tecnologia não encontrada.' });
        }

        await prisma.technology.delete({
            where: { id: req.params.id },
        });

        // Emit delete
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id).emit('technology:deleted', { id: req.params.id });
        }

        res.json({ message: 'Tecnologia removida com sucesso.' });
    } catch (error) {
        console.error('Delete technology error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
