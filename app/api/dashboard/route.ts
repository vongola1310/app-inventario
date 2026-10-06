import { businessDateKey } from '@/app/lib/dates';
import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse } from '@/app/lib/api-error';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, Tool } from '@prisma/client';

type EffectiveStatus = 'AVAILABLE' | 'IN_USE' | 'IN_CALIBRATION' | 'EXPIRED';

function calculateEffectiveStatus(
  tool: Pick<Tool, 'status' | 'isCalibrationTool' | 'nextCalibrationDate'>,
  currentDate: Date,
  isAtLab: boolean
): EffectiveStatus {
  if (isAtLab) return 'IN_CALIBRATION';

  const isCalibrationExpired =
    tool.isCalibrationTool &&
    (!tool.nextCalibrationDate || tool.nextCalibrationDate.toISOString().slice(0, 10) < businessDateKey(currentDate));

  if (isCalibrationExpired && tool.status === Status.AVAILABLE) {
    return 'EXPIRED';
  }

  return tool.status as EffectiveStatus;
}

export async function GET() {
  try {
    await requireAdmin();
    const tools = await prisma.tool.findMany({
      select: {
        id: true,
        name: true,
        qrId: true,
        status: true,
        isCalibrationTool: true,
        nextCalibrationDate: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            type: true,
            createdAt: true,
            clientJobId: true,
            expectedReturnDate: true,
            user: { select: { name: true, workerId: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const currentDate = new Date();

    const dashboardData = tools.map((tool) => {
      const lastLog = tool.logs[0];
      const who = lastLog?.user?.name || '---';
      const where = lastLog?.clientJobId || '---';
      const isAtLab =
        tool.status === Status.IN_USE &&
        typeof where === 'string' &&
        where === 'CALIBRACION';

      const effectiveStatus = calculateEffectiveStatus(tool, currentDate, isAtLab);
      const expectedReturnDateValue: Date | null =
        tool.status === Status.IN_USE ? (lastLog?.expectedReturnDate ?? null) : null;

      const expectedReturnDate =
        expectedReturnDateValue instanceof Date ? expectedReturnDateValue.toISOString() : null;

      const isOverdue =
        tool.status === Status.IN_USE && expectedReturnDateValue instanceof Date
          ? expectedReturnDateValue.toISOString().slice(0, 10) < businessDateKey(currentDate)
          : false;

      const rowData = {
        id: tool.id,
        name: tool.name,
        qrId: tool.qrId,
        status: tool.status,
        effectiveStatus,
        isCalibrationTool: tool.isCalibrationTool,
        timestamp: lastLog?.createdAt || null,
        nextCalibrationDate: tool.nextCalibrationDate?.toISOString() || null,
        expectedReturnDate,
        isOverdue,
        who: '---',
        where: '---',
        isAtLab,
      };

      if (isAtLab) {
        rowData.who = lastLog?.user?.name || 'Admin';
        rowData.where = 'Laboratorio de Calibración';
      } else if (tool.status === Status.IN_USE) {
        rowData.who = who;
        rowData.where = where;
      } else {
        rowData.who =
          effectiveStatus === 'EXPIRED'
            ? 'Requiere Calibración'
            : lastLog?.user?.name || '---';
        rowData.where = 'Showroom';
      }

      return rowData;
    });

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
