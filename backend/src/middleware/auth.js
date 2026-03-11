const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user with company and profile to request
 */
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
                active: true,
                companyId: true,
                accessProfileId: true,
                company: { select: { id: true, name: true, logo: true } },
                accessProfile: { select: { id: true, name: true, permissions: true } },
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        if (!user.active) {
            return res.status(401).json({ error: 'Sua conta está desativada.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado.' });
        }
        return res.status(401).json({ error: 'Token inválido.' });
    }
}

/**
 * Admin-only middleware
 */
function adminMiddleware(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
}

/**
 * Page permission middleware
 * Checks if user has access to a specific page
 */
function pagePermission(pageKey) {
    return (req, res, next) => {
        // Admin has full access
        if (req.user?.isAdmin) {
            return next();
        }

        const permissions = req.user?.accessProfile?.permissions;
        if (!permissions || !permissions[pageKey]) {
            return res.status(403).json({ error: 'Acesso negado a esta funcionalidade.' });
        }

        next();
    };
}

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.pagePermission = pagePermission;
