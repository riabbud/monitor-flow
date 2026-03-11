const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { sendResetEmail } = require('../config/mail');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ============================
// POST /api/auth/register
// ============================
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Nome é obrigatório.'),
        body('email').isEmail().withMessage('E-mail inválido.'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter no mínimo 6 caracteres.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password } = req.body;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'E-mail já cadastrado.' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
                select: { id: true, name: true, email: true, companyId: true },
            });

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, companyId: user.companyId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.status(201).json({ user, token });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// POST /api/auth/login
// ============================
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('E-mail inválido.'),
        body('password').notEmpty().withMessage('Senha é obrigatória.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    company: { select: { id: true, name: true } },
                    accessProfile: { select: { id: true, name: true, permissions: true } },
                },
            });
            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }

            // Check if user is active
            if (!user.active) {
                return res.status(403).json({ error: 'Sua conta está desativada. Entre em contato com o administrador.' });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, companyId: user.companyId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    active: user.active,
                    companyId: user.companyId,
                    accessProfileId: user.accessProfileId,
                    company: user.company,
                    accessProfile: user.accessProfile,
                },
                token,
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// GET /api/auth/me
// ============================
router.get('/me', authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true,
            active: true,
            companyId: true,
            accessProfileId: true,
            company: { select: { id: true, name: true } },
            accessProfile: { select: { id: true, name: true, permissions: true } },
        },
    });
    res.json({ user });
});

// ============================
// POST /api/auth/forgot-password
// ============================
router.post(
    '/forgot-password',
    [body('email').isEmail().withMessage('E-mail inválido.')],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Don't reveal if user exists
                return res.json({
                    message: 'Se o e-mail existir, um link de recuperação será enviado.',
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour

            await prisma.user.update({
                where: { email },
                data: {
                    resetToken,
                    resetExpires,
                },
            });

            // Send email
            try {
                await sendResetEmail(email, resetToken);
            } catch (mailError) {
                console.error('Mail error:', mailError);
                // Don't fail the request if email fails in dev
            }

            res.json({
                message: 'Se o e-mail existir, um link de recuperação será enviado.',
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

// ============================
// POST /api/auth/reset-password
// ============================
router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Token é obrigatório.'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter no mínimo 6 caracteres.'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { token, password } = req.body;

            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetExpires: { gt: new Date() },
                },
            });

            if (!user) {
                return res.status(400).json({ error: 'Token inválido ou expirado.' });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetExpires: null,
                },
            });

            res.json({ message: 'Senha redefinida com sucesso!' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
);

module.exports = router;
