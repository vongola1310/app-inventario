import { businessDateKey, businessDayRange, validDateKey } from '@/app/lib/dates';
import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse, ApiError } from '@/app/lib/api-error';
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
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const date = dateParam ?? businessDateKey();
    if (!validDateKey(date)) throw new ApiError(400, 'Fecha inválida. Usa YYYY-MM-DD');
    const { start: startOfDay, end: endOfDay } = businessDayRange(date);

    // Buscar todos los logs del día
    const logs = await prisma.log.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
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
        date,
        salidas,
        entradas,
        totalSalidas: salidas.length,
        totalEntradas: entradas.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}