const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tools = await prisma.tool.findMany({
    where: { status: 'IN_USE' },
    include: {
        logs: {
            orderBy: { createdAt: 'desc' },
            take: 1, 
            include: {
                user: { select: { name: true, workerId: true } }, 
            },
        },
    }
  });
  console.log(JSON.stringify(tools, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
