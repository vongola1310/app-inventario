import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse, ApiError, readBody, requiredText } from '@/app/lib/api-error';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await readBody(request);
    const { password, role } = body;
    const name = requiredText(body.name, 'nombre');
    const email = requiredText(body.email, 'email');
    const workerId = requiredText(body.workerId, 'ID de trabajador');
    if (password !== undefined && password !== null && typeof password !== 'string') throw new ApiError(400, 'Contraseña inválida');
    if (role !== undefined && role !== 'ADMIN' && role !== 'ENGINEER') throw new ApiError(400, 'Rol inválido');

    if (!name || !email || !workerId) {
      return NextResponse.json(
        { error: 'Faltan nombre, email o ID de trabajador' },
        { status: 400 }
      );
    }

    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.ENGINEER;
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, 'Usuario no encontrado');
    if (userRole === Role.ADMIN && !password && !current.password) throw new ApiError(400, 'Los administradores requieren contraseña');

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { workerId }],
        NOT: { id }
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email o ID de trabajador ya está registrado por otro usuario' },
        { status: 409 }
      );
    }

    const updateData: Prisma.UserUpdateInput = {
      name,
      email,
      workerId,
      role: userRole,
    };

    if (password) {
      updateData.password = await hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        workerId: true,
        role: true,
      }
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    return apiErrorResponse(error);
  }
}
