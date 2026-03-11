const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================
// GET /api/users (Listar)
// ============================
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        let whereClause = {};
        
        if (!req.user.isAdmin) {
            // Non-admin: only their company, never see admins
            whereClause.isAdmin = false;
            if (req.user.companyId) {
                whereClause.companyId = req.user.companyId;
            }
        } else if (companyId) {
            // Admin filtering by company: see company users OR all admins
            whereClause = {
                OR: [
                    { companyId: companyId },
                    { isAdmin: true }
                ]
            };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                active: true,
                companyId: true,
                accessProfileId: true,
                company: { select: { id: true, name: true } },
                accessProfile: { select: { id: true, name: true } },
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(users);
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// POST /api/users (Criar)
// ============================
router.post('/', async (req, res) => {
    const { name, email, password, companyId, accessProfileId, isAdmin, active } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                companyId: companyId || null,
                accessProfileId: accessProfileId || null,
                isAdmin: isAdmin || false,
                active: active !== undefined ? active : true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                active: true,
                companyId: true,
                accessProfileId: true,
                company: { select: { id: true, name: true } },
                accessProfile: { select: { id: true, name: true } },
                createdAt: true,
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================
// PUT /api/users/:id (Editar)
// ============================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, companyId, accessProfileId, isAdmin, active } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    try {
        // Verifica se o e-mail já pertence a outro usuário
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== id) {
            return res.status(400).json({ error: 'E-mail já está em uso por outro usuário.' });
        }

        const updateData = {
            name,
            email,
            companyId: companyId || null,
            accessProfileId: accessProfileId || null,
            active: active !== undefined ? active : true,
        };

        // Only admin can change isAdmin flag
        if (req.user.isAdmin && isAdmin !== undefined) {
            updateData.isAdmin = isAdmin;
        }

        // Se a senha foi informada, atualiza também
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                active: true,
                companyId: true,
                accessProfileId: true,
                company: { select: { id: true, name: true } },
                accessProfile: { select: { id: true, name: true } },
                createdAt: true,
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Erro interno do servidor ou usuário não encontrado.' });
    }
});

// ============================
// DELETE /api/users/:id (Excluir)
// ============================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Impede o usuário de deletar a si mesmo
    if (req.user.id === id) {
        return res.status(400).json({ error: 'Você não pode excluir a sua própria conta.' });
    }

    // Impede deletar admin
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.isAdmin) {
        return res.status(400).json({ error: 'Não é possível excluir um administrador.' });
    }

    try {
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Usuário removido com sucesso.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro interno do servidor ou usuário não encontrado.' });
    }
});

module.exports = router;
