const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Available pages/permissions
const AVAILABLE_PAGES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'monitoring', label: 'Monitoramento' },
    { key: 'servers', label: 'Servidores' },
    { key: 'technologies', label: 'Tecnologias' },
    { key: 'applications', label: 'Sistemas' },
    { key: 'users', label: 'Usuários' },
    { key: 'companies', label: 'Empresas' },
    { key: 'accessProfiles', label: 'Perfis de Acesso' },
];

// ============================
// GET /api/access-profiles/pages - List available pages
// ============================
router.get('/pages', (req, res) => {
    res.json(AVAILABLE_PAGES);
});

// ============================
// GET /api/access-profiles
// ============================
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        const whereClause = {};

        // Non-admin: only profiles from their company
        if (!req.user.isAdmin && req.user.companyId) {
            whereClause.companyId = req.user.companyId;
        }

        // Admin with company filter
        if (req.user.isAdmin && companyId) {
            whereClause.companyId = companyId;
        }

        const profiles = await prisma.accessProfile.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { users: true } },
            },
        });
        res.json(profiles);
    } catch (error) {
        console.error('List access profiles error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/access-profiles/:id
// ============================
router.get('/:id', async (req, res) => {
    try {
        const profile = await prisma.accessProfile.findUnique({
            where: { id: req.params.id },
            include: {
                company: { select: { id: true, name: true } },
                users: { select: { id: true, name: true, email: true } },
            },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Perfil não encontrado.' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get access profile error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/access-profiles
// ============================
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('companyId').notEmpty().withMessage('Empresa é obrigatória.'),
        body('permissions').isObject().withMessage('Permissões são obrigatórias.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, companyId, description, permissions } = req.body;

            const profile = await prisma.accessProfile.create({
                data: {
                    name,
                    companyId,
                    description: description || null,
                    permissions,
                },
                include: {
                    company: { select: { id: true, name: true } },
                },
            });

            res.status(201).json(profile);
        } catch (error) {
            console.error('Create access profile error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// PUT /api/access-profiles/:id
// ============================
router.put(
    '/:id',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('companyId').notEmpty().withMessage('Empresa é obrigatória.'),
        body('permissions').isObject().withMessage('Permissões são obrigatórias.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, companyId, description, permissions, active } = req.body;

            const profile = await prisma.accessProfile.update({
                where: { id: req.params.id },
                data: {
                    name,
                    companyId,
                    description: description || null,
                    permissions,
                    active: active !== undefined ? active : true,
                },
                include: {
                    company: { select: { id: true, name: true } },
                },
            });

            res.json(profile);
        } catch (error) {
            console.error('Update access profile error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// DELETE /api/access-profiles/:id
// ============================
router.delete('/:id', async (req, res) => {
    try {
        await prisma.accessProfile.delete({ where: { id: req.params.id } });
        res.json({ message: 'Perfil removido com sucesso.' });
    } catch (error) {
        console.error('Delete access profile error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/access-profiles/by-company/:companyId
// ============================
router.get('/by-company/:companyId', async (req, res) => {
    try {
        // Security check: non-admin can only see profiles for their own company
        if (!req.user.isAdmin && req.user.companyId !== req.params.companyId) {
            return res.status(403).json({ error: 'Acesso negado. Você não pode ver perfis de outra empresa.' });
        }

        const profiles = await prisma.accessProfile.findMany({
            where: { companyId: req.params.companyId, active: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
        res.json(profiles);
    } catch (error) {
        console.error('List profiles by company error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
