import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, LogType } from '@prisma/client';

/**
 * API Route: POST /api/checkin
 * 1. Valida IDs.
 * 2. Verifica propiedad (solo quien sacó puede devolver).
 * 3. Guarda en historial con ubicación "Showroom" y comentarios.
 * 4. Marca herramienta como DISPONIBLE.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrId, workerId, comments } = body;

    // Validación básica
    if (!qrId || !workerId) {
      return NextResponse.json(
        { error: 'Faltan qrId o workerId' },
        { status: 400 }
      );
    }

    // 1. Buscar al USUARIO
    const currentUser = await prisma.user.findUnique({
      where: { workerId: workerId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'ID de Trabajador no encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar la HERRAMIENTA
    const tool = await prisma.tool.findUnique({
      where: { qrId: qrId },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Herramienta no encontrada' },
        { status: 404 }
      );
    }

    // 3. Validar estado actual
    if (tool.status === Status.AVAILABLE) {
      return NextResponse.json(
        { error: 'Esta herramienta ya estaba disponible (en Showroom)' },
        { status: 409 }
      );
    }

    // 4. VALIDACIÓN DE PROPIEDAD
    // Buscamos el último registro de SALIDA de esta herramienta
    const lastCheckoutLog = await prisma.log.findFirst({
      where: {
        toolId: tool.id,
        type: LogType.CHECK_OUT,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true, // Traemos al usuario para saber quién fue
      }
    });

    // Si existe un registro de salida, verificamos que coincida el usuario
    if (lastCheckoutLog) {
      if (lastCheckoutLog.userId !== currentUser.id) {
        return NextResponse.json(
          { 
            error: `Error: Esta herramienta fue sacada por ${lastCheckoutLog.user.name} (ID: ${lastCheckoutLog.user.workerId}). Solo él puede devolverla.` 
          },
          { status: 403 } // 403 Forbidden
        );
      }
    }

    // 5. Transacción (Guardar todo)
    const [logEntry, updatedTool] = await prisma.$transaction([
      // A. Crear el Log de Devolución
      prisma.log.create({
        data: {
          type: LogType.CHECK_IN,
          userId: currentUser.id,
          toolId: tool.id,
          clientJobId: 'Showroom',    // <--- REGLA: Siempre vuelve a Showroom
          comments: comments || null, // <--- REGLA: Guardamos comentarios
        },
      }),
      // B. Actualizar estado de la herramienta
      prisma.tool.update({
        where: { id: tool.id },
        data: {
          status: Status.AVAILABLE,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Check-in exitoso',
      tool: updatedTool,
      log: logEntry,
    }, { status: 200 });

  } catch (error) {
    console.error('Error en el Check-In:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}