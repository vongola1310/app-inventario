import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, LogType } from '@prisma/client';

/**
 * API Route: POST /api/checkout
 *
 * Reglas:
 * 1. Bloquea si la calibración está vencida o sin fecha.
 * 2. Bloquea si la herramienta ya está IN_USE.
 * 3. Requiere aceptación EXPLÍCITA de la carta responsiva.
 *    Guarda la versión del texto vigente en el Log para auditoría.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      qrId,
      workerId,
      clientName,
      responsivaAccepted,
      responsivaVersion,
    } = body;

    // Validación básica
    if (!qrId || !workerId) {
      return NextResponse.json(
        { error: 'Faltan qrId o workerId' },
        { status: 400 }
      );
    }

    // --- NUEVO: Validación de Carta Responsiva ---
    if (responsivaAccepted !== true) {
      return NextResponse.json(
        {
          error:
            'Debes aceptar la carta responsiva antes de sacar la herramienta',
        },
        { status: 400 }
      );
    }
    if (!responsivaVersion || typeof responsivaVersion !== 'string') {
      return NextResponse.json(
        { error: 'Falta la versión de la carta responsiva' },
        { status: 400 }
      );
    }
    // ---------------------------------------------

    // 1. Buscar al USUARIO
    const user = await prisma.user.findUnique({
      where: { workerId: workerId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'ID de Trabajador no encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar la HERRAMIENTA (incluyendo los campos de calibración)
    const tool = await prisma.tool.findUnique({
      where: { qrId: qrId },
      select: {
        id: true,
        name: true,
        status: true,
        isCalibrationTool: true,
        nextCalibrationDate: true,
      },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Herramienta no encontrada' },
        { status: 404 }
      );
    }

    // --- LÓGICA DE BLOQUEO POR CALIBRACIÓN VENCIDA ---
    const currentDate = new Date();
    const isCalibrationExpired =
      tool.isCalibrationTool &&
      tool.nextCalibrationDate &&
      new Date(tool.nextCalibrationDate) < currentDate;

    if (isCalibrationExpired) {
      return NextResponse.json(
        {
          error: `BLOQUEADO: La calibración de ${tool.name} está vencida desde ${tool.nextCalibrationDate!.toLocaleDateString(
            'es-MX'
          )}. Debe ir al Laboratorio.`,
        },
        { status: 403 }
      );
    } else if (tool.isCalibrationTool && !tool.nextCalibrationDate) {
      return NextResponse.json(
        {
          error: `BLOQUEADO: ${tool.name} es una herramienta de verificación y no tiene fecha de próxima calibración asignada. Consulta a Administración.`,
        },
        { status: 403 }
      );
    }

    // 3. Validar estado actual
    if (tool.status === Status.IN_USE) {
      return NextResponse.json(
        { error: 'Esta herramienta ya está en uso' },
        { status: 409 }
      );
    }

    // 4. Ejecutar la transacción (Check-Out)
    const [logEntry, updatedTool] = await prisma.$transaction([
      prisma.log.create({
        data: {
          type: LogType.CHECK_OUT,
          clientJobId: clientName,
          userId: user.id,
          toolId: tool.id,
          // --- NUEVO: Persistir la aceptación de la responsiva ---
          responsivaAccepted: true,
          responsivaVersion: responsivaVersion,
        },
      }),
      prisma.tool.update({
        where: { id: tool.id },
        data: { status: Status.IN_USE },
      }),
    ]);

    return NextResponse.json(
      {
        message: 'Check-out exitoso',
        tool: updatedTool,
        log: logEntry,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en el Check-Out:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}