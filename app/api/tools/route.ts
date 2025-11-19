import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, qrId, isCalibrationTool, nextCalibrationDate } = body; 

    // Validación básica
    if (!name || !qrId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (name, qrId)' },
        { status: 400 }
      );
    }
    
    const existingTool = await prisma.tool.findUnique({ where: { qrId } });
    if (existingTool) {
      return NextResponse.json(
        { error: `Ya existe una herramienta con el QR ID ${qrId}` },
        { status: 409 }
      );
    }

    // --- EL OBJETO DE CREACIÓN DEBE SER EXPLÍCITO ---
    const newTool = await prisma.tool.create({
      data: {
        name,
        qrId,
        status: Status.AVAILABLE,
        // Usamos la propiedad que ya está definida en ToolCreateInput
        isCalibrationTool: !!isCalibrationTool,
        nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
      },
    });
    // ------------------------------------------------

    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    console.error('Error al crear herramienta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}