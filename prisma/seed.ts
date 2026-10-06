import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

// Inicializar el cliente de Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el script de seeding...');

    // --- 1. Define los datos de tu Admin ---
    const adminEmail = 'ju4nch01310@revvity.com';
    const adminPassword = 'NuevaPassword123!'; // <-- ¡Usa esta nueva contraseña para entrar!
    const adminWorkerId = 'ADMIN-001';
    
    // Hashear la contraseña
    const hashedPassword = await hash(adminPassword, 12);

    // --- 2. Usa "upsert" para crear o actualizar tu Admin ---
    try {
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          password: hashedPassword,
          role: Role.ADMIN,
          name: 'Juan Admin',
        },
        create: {
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN,
          name: 'Juan Admin',
          workerId: adminWorkerId,
        },
      });

      console.log('¡Éxito! Contraseña de admin actualizada para:', adminEmail);

    // --- Crear un usuario regular (Ingeniero) ---
    const engineerEmail = 'ingeniero@ejemplo.com';
    const engineerPassword = 'password123';
    const engineerWorkerId = 'EMP-001';
    const hashedEngineerPassword = await hash(engineerPassword, 12);

    const engineerUser = await prisma.user.upsert({
      where: { email: engineerEmail },
      update: {
        password: hashedEngineerPassword,
        role: Role.ENGINEER,
        name: 'Ingeniero de Pruebas',
        workerId: engineerWorkerId,
      },
      create: {
        email: engineerEmail,
        password: hashedEngineerPassword,
        role: Role.ENGINEER,
        name: 'Ingeniero de Pruebas',
        workerId: engineerWorkerId,
      },
    });

    console.log('¡Éxito! Usuario Ingeniero creado/actualizado:');
    console.log(engineerUser);

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