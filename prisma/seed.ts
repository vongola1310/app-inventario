import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

// Inicializar el cliente de Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el script de seeding...');

  // --- 1. Define los datos de tu Admin ---
  const adminEmail = 'jua.ramirez@revviy.com';
  const adminPassword = 'morocho15'; // <-- ¡Recuerda esta contraseña!
  const adminWorkerId = '33126';
  
  // Hashear la contraseña
  const hashedPassword = await hash(adminPassword, 12);

  // --- 2. Usa "upsert" para crear o actualizar tu Admin ---
  // "upsert" = "update" (actualizar) o "insert" (insertar).
  // Es seguro de correr múltiples veces.
  try {
    const adminUser = await prisma.user.upsert({
      // 1. Dónde buscar (campo único)
      where: { email: adminEmail },
      
      // 2. Qué actualizar (si ya existe)
      update: {
        password: hashedPassword,
        role: Role.ADMIN,
        name: 'Administrador Principal',
        workerId: adminWorkerId,
      },
      
      // 3. Qué crear (si no existe)
      create: {
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        name: 'Administrador Principal',
        workerId: adminWorkerId,
      },
    });

    console.log('¡Éxito! Usuario Admin creado/actualizado:');
    console.log(adminUser);

  } catch (error) {
    console.error('Error al crear el admin:', error);
  }
}

// --- 3. Ejecutar la función y desconectar ---
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerrar la conexión de la base de datos
    await prisma.$disconnect();
    console.log('Seeding terminado.');
  });