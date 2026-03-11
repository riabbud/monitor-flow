const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================
// GET /api/companies
// ============================
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        const whereClause = {};

        // Non-admin: only their company
        if (!req.user.isAdmin && req.user.companyId) {
            whereClause.id = req.user.companyId;
        }

        // Admin with company filter
        if (req.user.isAdmin && companyId) {
            whereClause.id = companyId;
        }

        const companies = await prisma.company.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { users: true, accessProfiles: true },
                },
            },
        });
        res.json(companies);
    } catch (error) {
        console.error('List companies error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/companies/:id
// ============================
router.get('/:id', async (req, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.params.id },
            include: {
                users: {
                    select: { id: true, name: true, email: true },
                },
                accessProfiles: true,
            },
        });

        if (!company) {
            return res.status(404).json({ error: 'Empresa não encontrada.' });
        }

        res.json(company);
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/companies
// ============================
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('cnpj').optional({ nullable: true }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, cnpj, logo } = req.body;

            // Check CNPJ uniqueness if provided
            if (cnpj) {
                const existing = await prisma.company.findUnique({ where: { cnpj } });
                if (existing) {
                    return res.status(400).json({ error: 'CNPJ já cadastrado.' });
                }
            }

            const company = await prisma.company.create({
                data: { name, cnpj: cnpj || null, logo: logo || null },
            });

            res.status(201).json(company);
        } catch (error) {
            console.error('Create company error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// PUT /api/companies/:id
// ============================
router.put(
    '/:id',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('cnpj').optional({ nullable: true }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, cnpj, active, logo } = req.body;

            // Check CNPJ uniqueness if provided
            if (cnpj) {
                const existing = await prisma.company.findFirst({
                    where: { cnpj, NOT: { id: req.params.id } },
                });
                if (existing) {
                    return res.status(400).json({ error: 'CNPJ já cadastrado.' });
                }
            }

            const company = await prisma.company.update({
                where: { id: req.params.id },
                data: {
                    name,
                    cnpj: cnpj || null,
                    logo: logo || null,
                    active: active !== undefined ? active : true,
                },
            });

            res.json(company);
        } catch (error) {
            console.error('Update company error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// DELETE /api/companies/:id
// ============================
router.delete('/:id', async (req, res) => {
    try {
        await prisma.company.delete({ where: { id: req.params.id } });
        res.json({ message: 'Empresa removida com sucesso.' });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// GET /api/companies/select/list - for dropdowns
// ============================
router.get('/select/list', async (req, res) => {
    try {
        const { companyId } = req.query;
        const whereClause = { active: true };

        // Non-admin: only their company
        if (!req.user.isAdmin && req.user.companyId) {
            whereClause.id = req.user.companyId;
        }

        const companies = await prisma.company.findMany({
            where: whereClause,
            select: { id: true, name: true, logo: true },
            orderBy: { name: 'asc' },
        });
        res.json(companies);
    } catch (error) {
        console.error('List companies select error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
