import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * API Route: PATCH /api/tools/[id]
 * Actualiza campos específicos de una herramienta (ej. fecha de calibración).
 * COMPATIBLE CON NEXT.JS 15: 'params' ahora es una Promesa.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    const toolId = id;

    const body = await request.json();
    const { action, nextCalibrationDate, adminId } = body;

    if (!toolId) {
      return NextResponse.json({ error: 'Falta el ID de la herramienta' }, { status: 400 });
    }

    // Buscamos a un usuario admin por defecto si no nos pasan adminId
    let userId = adminId;
    if (!userId) {
      const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (defaultAdmin) userId = defaultAdmin.id;
    }

    if (action === 'SEND_TO_CALIBRATION') {
      const [log, updatedTool] = await prisma.$transaction([
        prisma.log.create({
          data: {
            type: 'CHECK_OUT',
            clientJobId: 'CALIBRACION',
            userId: userId,
            toolId: toolId,
          },
        }),
        prisma.tool.update({
          where: { id: toolId },
          data: { status: 'IN_USE' },
        }),
      ]);
      return NextResponse.json(updatedTool, { status: 200 });
    }

    if (action === 'RECEIVE_FROM_CALIBRATION') {
      if (!nextCalibrationDate) {
         return NextResponse.json({ error: 'Se requiere una nueva fecha' }, { status: 400 });
      }
      const [log, updatedTool] = await prisma.$transaction([
        prisma.log.create({
          data: {
            type: 'CHECK_IN',
            clientJobId: 'REGRESO_CALIBRACION',
            userId: userId,
            toolId: toolId,
          },
        }),
        prisma.tool.update({
          where: { id: toolId },
          data: { 
            status: 'AVAILABLE',
            nextCalibrationDate: new Date(nextCalibrationDate)
          },
        }),
      ]);
      return NextResponse.json(updatedTool, { status: 200 });
    }

    // Comportamiento anterior por defecto
    if (!nextCalibrationDate) {
       return NextResponse.json({ error: 'Se requiere una nueva fecha' }, { status: 400 });
    }

    const updatedTool = await prisma.tool.update({
      where: { id: toolId },
      data: {
        nextCalibrationDate: new Date(nextCalibrationDate),
        status: 'AVAILABLE' // Forzamos a AVAILABLE por seguridad
      },
    });

    return NextResponse.json(updatedTool, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, qrId, isCalibrationTool, nextCalibrationDate } = body;

    const existingTool = await prisma.tool.findUnique({
      where: { qrId },
    });

    if (existingTool && existingTool.id !== id) {
      return NextResponse.json(
        { error: `Ya existe otra herramienta con el QR ID ${qrId}` },
        { status: 409 }
      );
    }

    const updatedTool = await prisma.tool.update({
      where: { id },
      data: {
        name,
        qrId,
        isCalibrationTool: !!isCalibrationTool,
        nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
      },
    });

    return NextResponse.json(updatedTool, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}