import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, LogType } from '@prisma/client';
import { addBusinessDays, isBusinessDay } from '@/app/lib/business-days';

/**
 * API Route: POST /api/checkout
 *
 * Reglas:
 * 1. Bloquea si la calibración está vencida.
 * 2. Bloquea si la herramienta ya está IN_USE.
 * 3. Requiere aceptación de la carta responsiva.
 * 4. Calcula la fecha esperada de retorno: hoy + 1 día hábil
 *    (saltando fines de semana y festivos MX).
 *    Si el ingeniero manda una fecha personalizada, debe ser >= mínima.
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
      expectedReturnDate, // opcional, formato ISO string
    } = body;

    // Validación básica
    if (!qrId || !workerId) {
      return NextResponse.json(
        { error: 'Faltan qrId o workerId' },
        { status: 400 }
      );
    }

    // Validación de Carta Responsiva
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

    // --- Cálculo de Fecha Esperada de Retorno ---
    const today = new Date();
    const minReturn = addBusinessDays(today, 1); // mínimo: 1 día hábil

    let finalReturnDate: Date;
    if (expectedReturnDate) {
      const requested = new Date(expectedReturnDate);
      if (isNaN(requested.getTime())) {
        return NextResponse.json(
          { error: 'Fecha de retorno inválida' },
          { status: 400 }
        );
      }
      // Debe ser >= mínima
      if (requested < minReturn) {
        return NextResponse.json(
          {
            error: `La fecha de retorno debe ser igual o posterior a ${minReturn.toLocaleDateString('es-MX')}`,
          },
          { status: 400 }
        );
      }
      // Y debe caer en día hábil
      if (!isBusinessDay(requested)) {
        return NextResponse.json(
          {
            error:
              'La fecha de retorno debe ser un día hábil (no sábado, domingo ni festivo)',
          },
          { status: 400 }
        );
      }
      finalReturnDate = requested;
    } else {
      finalReturnDate = minReturn;
    }
    // ---------------------------------------------

    // Buscar al USUARIO
    const user = await prisma.user.findUnique({
      where: { workerId: workerId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'ID de Trabajador no encontrado' },
        { status: 404 }
      );
    }

    // Buscar la HERRAMIENTA
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

    // Bloqueo por calibración vencida
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
          error: `BLOQUEADO: ${tool.name} es una herramienta de verificación y no tiene fecha de próxima calibración asignada.`,
        },
        { status: 403 }
      );
    }

    // Validar estado actual
    if (tool.status === Status.IN_USE) {
      return NextResponse.json(
        { error: 'Esta herramienta ya está en uso' },
        { status: 409 }
      );
    }

    // Ejecutar la transacción (Check-Out)
    const [logEntry, updatedTool] = await prisma.$transaction([
      prisma.log.create({
        data: {
          type: LogType.CHECK_OUT,
          clientJobId: clientName,
          userId: user.id,
          toolId: tool.id,
          responsivaAccepted: true,
          responsivaVersion: responsivaVersion,
          expectedReturnDate: finalReturnDate,
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
        expectedReturnDate: finalReturnDate.toISOString(),
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