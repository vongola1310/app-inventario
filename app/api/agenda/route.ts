import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { LogType } from '@prisma/client';

/**
 * API Route: GET /api/agenda?date=YYYY-MM-DD
 *
 * Devuelve los movimientos del día solicitado, separados en
 * "salidas" (CHECK_OUT) y "entradas" (CHECK_IN).
 *
 * Si no se manda fecha, usa el día actual.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Calcular rango del día (00:00 a 23:59:59)
    let startOfDay: Date;
    let endOfDay: Date;

    if (dateParam) {
      const [y, m, d] = dateParam.split('-').map(Number);
      if (!y || !m || !d) {
        return NextResponse.json(
          { error: 'Formato de fecha inválido. Usa YYYY-MM-DD' },
          { status: 400 }
        );
      }
      startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
      endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Buscar todos los logs del día
    const logs = await prisma.log.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        clientJobId: true,
        comments: true,
        expectedReturnDate: true,
        tool: { select: { name: true, qrId: true } },
        user: { select: { name: true, workerId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Formatear y separar
    const formatted = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      toolName: log.tool.name,
      toolQrId: log.tool.qrId,
      userName: log.user.name || '---',
      userWorkerId: log.user.workerId,
      clientName: log.clientJobId,
      comments: log.comments,
      expectedReturnDate: log.expectedReturnDate?.toISOString() || null,
    }));

    const salidas = formatted.filter((_, i) => logs[i].type === LogType.CHECK_OUT);
    const entradas = formatted.filter((_, i) => logs[i].type === LogType.CHECK_IN);

    return NextResponse.json(
      {
        date: startOfDay.toISOString().split('T')[0],
        salidas,
        entradas,
        totalSalidas: salidas.length,
        totalEntradas: entradas.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener agenda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}