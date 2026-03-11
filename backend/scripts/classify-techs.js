const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const classification = {
    'Banco de Dados': [
        'PostgreSQL', 'MySQL', 'MongoDB', 'Oracle DB', 'SQL Server', 'Redis',
        'Elasticsearch', 'Oracle Database', 'MariaDB', 'SQLite', 'Firebase'
    ],
    'Frontend': [
        'Vue.js', 'React', 'Angular', 'TypeScript', 'Dart', 'Flutter',
        'Oracle APEX', 'HTML', 'CSS', 'JavaScript', 'Tailwind', 'Bootstrap'
    ],
    'Backend': [
        'Node.js', 'Python', 'Java', '.NET', 'PHP', 'Spring Boot', 'Laravel',
        'Express.js', 'C#', 'Go', 'Ruby', 'Ruby on Rails', 'Django', 'Flask',
        'Nginx', 'Apache', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud',
        'RabbitMQ', 'Kafka'
    ]
};

async function classify() {
    try {
        const technologies = await prisma.technology.findMany();
        console.log(`Classificando ${technologies.length} tecnologias...`);

        let updatedCount = 0;

        for (const tech of technologies) {
            let type = null;

            // Busca por correspondência exata ou parcial (ignorando cases)
            for (const [category, names] of Object.entries(classification)) {
                if (names.some(name => tech.name.toLowerCase().includes(name.toLowerCase()))) {
                    type = category;
                    break;
                }
            }

            // Se não encontrou, tenta um fallback genérico ou deixa como está
            if (type) {
                await prisma.technology.update({
                    where: { id: tech.id },
                    data: { type }
                });
                updatedCount++;
            }
        }

        console.log(`Sucesso! ${updatedCount} tecnologias foram classificadas.`);
    } catch (error) {
        console.error('Erro na classificação:', error);
    } finally {
        await prisma.$disconnect();
    }
}

classify();
