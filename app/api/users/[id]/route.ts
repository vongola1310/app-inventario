import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, workerId, role, password } = body;

    if (!name || !email || !workerId) {
      return NextResponse.json(
        { error: 'Faltan nombre, email o ID de trabajador' },
        { status: 400 }
      );
    }

    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.ENGINEER;

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

    let updateData: any = {
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
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
