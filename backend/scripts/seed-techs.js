const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const techNames = [
    'Oracle APEX',
    'Node.js',
    'Vue.js',
    'React',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Docker',
    'Python',
    'Java',
    '.NET',
    'PHP',
    'Oracle DB',
    'SQL Server',
    'Redis',
    'Angular',
    'TypeScript',
    'Spring Boot',
    'Laravel',
    'Express.js',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud',
    'Nginx',
    'Apache',
    'Elasticsearch',
    'RabbitMQ',
    'Kafka',
    'Dart',
    'Flutter'
];

async function seed() {
    try {
        // Pegar o primeiro usuário para associar as tecnologias
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('Nenhum usuário encontrado. Cadastre um usuário primeiro.');
            return;
        }

        // Pegar tecnologias existentes
        const existingTechs = await prisma.technology.findMany({
            where: { userId: user.id }
        });
        const existingNames = existingTechs.map(t => t.name.toLowerCase());

        const toInsert = techNames.filter(name => !existingNames.includes(name.toLowerCase()));

        if (toInsert.length === 0) {
            console.log('Todas as tecnologias já estão cadastradas.');
            return;
        }

        console.log(`Inserindo ${toInsert.length} novas tecnologias para o usuário ${user.name}...`);

        await prisma.technology.createMany({
            data: toInsert.map(name => ({
                name,
                userId: user.id
            }))
        });

        console.log('Tecnologias inseridas com sucesso!');
    } catch (error) {
        console.error('Erro ao inserir tecnologias:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
