import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, LogType } from '@prisma/client';

/**
 * API Route: POST /api/checkout
 * ACTUALIZACIÓN: Bloquea el check-out si la calibración está vencida.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrId, workerId, clientName } = body;

    // Validación básica
    if (!qrId || !workerId) {
      return NextResponse.json(
        { error: 'Faltan qrId o workerId' },
        { status: 400 }
      );
    }

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
      // Es crucial seleccionar los campos de calibración
      select: {
          id: true,
          name: true,
          status: true,
          isCalibrationTool: true,
          nextCalibrationDate: true,
      }
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Herramienta no encontrada' },
        { status: 404 }
      );
    }

    // --- LÓGICA DE BLOQUEO POR CALIBRACIÓN VENCIDA (CORREGIDA) ---
    const currentDate = new Date();
    // Verificamos si es una herramienta de calibración Y si tiene una fecha
    const isCalibrationExpired = tool.isCalibrationTool && tool.nextCalibrationDate && new Date(tool.nextCalibrationDate) < currentDate;

    if (isCalibrationExpired) {
        // La fecha existe y es anterior a hoy.
        return NextResponse.json(
            { 
                error: `BLOQUEADO: La calibración de ${tool.name} está vencida desde ${tool.nextCalibrationDate!.toLocaleDateString('es-MX')}. Debe ir al Laboratorio.`
            },
            { status: 403 } // 403 Forbidden
        );
    } else if (tool.isCalibrationTool && !tool.nextCalibrationDate) {
        // CORRECCIÓN ADICIONAL: Bloquea si es de calibración pero NO TIENE fecha asignada
        return NextResponse.json(
            { 
                error: `BLOQUEADO: ${tool.name} es una herramienta de verificación y no tiene fecha de próxima calibración asignada. Consulta a Administración.`
            },
            { status: 403 } // 403 Forbidden
        );
    }
    // --------------------------------------------------------

    // 3. Validar estado (Si la herramienta ya está en uso, y no está vencida)
    if (tool.status === Status.IN_USE) {
      return NextResponse.json(
        { error: 'Esta herramienta ya está en uso' },
        { status: 409 }
      );
    }

    // 4. Ejecutar la transacción (Check-Out)
    const [logEntry, updatedTool] = await prisma.$transaction([
      // A. Crear el Log
      prisma.log.create({
        data: {
          type: LogType.CHECK_OUT,
          clientJobId: clientName,
          userId: user.id,
          toolId: tool.id,
        },
      }),

      // B. Actualizar el estado a IN_USE
      prisma.tool.update({
        where: { id: tool.id },
        data: { status: Status.IN_USE },
      }),
    ]);

    // 5. Enviar una respuesta exitosa
    return NextResponse.json({
      message: 'Check-out exitoso',
      tool: updatedTool,
      log: logEntry,
    }, { status: 200 });

  } catch (error) {
    console.error('Error en el Check-Out:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}