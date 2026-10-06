import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const workerId = process.env.SEED_ADMIN_WORKER_ID;
  if (!email || !password || !workerId) {
    throw new Error('Configura SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD y SEED_ADMIN_WORKER_ID');
  }
  const hashedPassword = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: Role.ADMIN },
    create: { email, workerId, password: hashedPassword, role: Role.ADMIN, name: process.env.SEED_ADMIN_NAME || 'Administrador' },
  });
  console.log('Administrador creado o actualizado.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
