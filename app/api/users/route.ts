import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';

/**
 * API Route: POST /api/users
 * Crea un nuevo usuario.
 * La contraseña SÓLO es requerida si el rol es ADMIN.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, email, workerId, password, role } = body;

    // 1. Validación básica
    if (!name || !email || !workerId) {
      return NextResponse.json(
        { error: 'Faltan nombre, email o ID de trabajador' },
        { status: 400 }
      );
    }
    
    // Asignar rol (si no viene, es ENGINEER)
    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.ENGINEER;

    // 2. Validación de Contraseña SÓLO para Admins
    if (userRole === Role.ADMIN && !password) {
      return NextResponse.json(
        { error: 'Los Admins deben tener una contraseña' },
        { status: 400 }
      );
    }

    // 3. Validar duplicados
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: email }, { workerId: workerId }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email o ID de trabajador ya está registrado' },
        { status: 409 }
      );
    }

    // 4. Hashear contraseña (sólo si se proporcionó)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hash(password, 12);
    }

    // 5. Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        workerId: workerId,
        password: hashedPassword, // Será null para Ingenieros
        role: userRole,
      },
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}