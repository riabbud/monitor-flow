const prisma = require('../config/database');

/**
 * Build a userId filter based on company context.
 * 
 * - Admin + companyId query: filter by users in that company
 * - Admin + no companyId: no filter (sees all)
 * - Non-admin + has company: filter by all users in user's company
 * - Non-admin + no company: filter by own userId only
 * 
 * @param {Object} user - req.user object
 * @param {string|null} companyIdQuery - companyId from query params
 * @returns {Object} Prisma where clause for userId filtering
 */
async function buildCompanyFilter(user, companyIdQuery) {
    if (user.isAdmin && companyIdQuery) {
        // Admin filtering by specific company
        const companyUsers = await prisma.user.findMany({
            where: { companyId: companyIdQuery },
            select: { id: true },
        });
        return { userId: { in: companyUsers.map(u => u.id) } };
    }

    if (user.isAdmin && !companyIdQuery) {
        // Admin without filter sees all
        return {};
    }

    if (user.companyId) {
        // Non-admin user: see all data from their company
        const companyUsers = await prisma.user.findMany({
            where: { companyId: user.companyId },
            select: { id: true },
        });
        return { userId: { in: companyUsers.map(u => u.id) } };
    }

    // Non-admin without company: own data only
    return { userId: user.id };
}

module.exports = { buildCompanyFilter };
