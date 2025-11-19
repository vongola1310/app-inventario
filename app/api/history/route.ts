import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * API Route: GET /api/history
 * Obtiene el historial completo incluyendo los comentarios.
 */
export async function GET() {
  try {
    const logs = await prisma.log.findMany({
      // Ordenar por fecha (más reciente primero)
      orderBy: { createdAt: 'desc' },
      
      // Límite (opcional, para rendimiento)
      take: 100, 

      // Incluir datos relacionados
      include: {
        tool: {
          select: { name: true, qrId: true },
        },
        user: {
          select: { name: true, workerId: true },
        },
      },
    });

    // Procesar datos para el frontend
    const historyData = logs.map((log) => ({
      id: log.id,
      toolName: log.tool.name,
      toolQrId: log.tool.qrId,
      action: log.type, // CHECK_IN o CHECK_OUT
      userName: log.user.name || 'Usuario desconocido',
      userWorkerId: log.user.workerId,
      clientName: log.clientJobId || '---',
      comments: log.comments || null, // <--- ¡Aquí va el comentario!
      timestamp: log.createdAt.toISOString(),
    }));

    return NextResponse.json(historyData, { status: 200 });

  } catch (error) {
    console.error('Error al obtener el historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}