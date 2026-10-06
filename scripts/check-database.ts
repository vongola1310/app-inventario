import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
async function main() {
  // Solo lectura: comprueba conectividad y la columna usada por agenda y préstamos.
  await db.log.findFirst({ select: { expectedReturnDate: true } });
  console.log('Conexión a PostgreSQL y Log.expectedReturnDate: OK');
}
main().catch((error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? error.code : 'desconocido';
  console.error(`No se pudo verificar la base de datos (código: ${code}).`);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
