const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const adminEmail = 'admin@monitorflow.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const admin = await prisma.user.create({
            data: {
                name: 'Administrador',
                email: adminEmail,
                password: hashedPassword,
                isAdmin: true,
            },
        });
        console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);
    } else {
        // Ensure existing admin has isAdmin = true
        await prisma.user.update({
            where: { email: adminEmail },
            data: { isAdmin: true },
        });
        console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    console.log('🌱 Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
