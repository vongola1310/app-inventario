import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse, ApiError, readBody, requiredText } from '@/app/lib/api-error';
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
    await requireAdmin();
    const body = await readBody(request);
    const { password, role } = body;
    const name = requiredText(body.name, 'nombre');
    const email = requiredText(body.email, 'email');
    const workerId = requiredText(body.workerId, 'ID de trabajador');
    if (password !== undefined && password !== null && typeof password !== 'string') throw new ApiError(400, 'Contraseña inválida');
    if (role !== undefined && role !== 'ADMIN' && role !== 'ENGINEER') throw new ApiError(400, 'Rol inválido');

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
    
    const userWithoutPassword = { id: newUser.id, name: newUser.name, email: newUser.email, workerId: newUser.workerId, role: newUser.role };
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        workerId: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}