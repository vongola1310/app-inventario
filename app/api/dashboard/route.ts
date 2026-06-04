import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status, Tool } from '@prisma/client';

type EffectiveStatus = 'AVAILABLE' | 'IN_USE' | 'IN_CALIBRATION';

function calculateEffectiveStatus(
  tool: Pick<Tool, 'status' | 'isCalibrationTool' | 'nextCalibrationDate'>,
  currentDate: Date
): EffectiveStatus {
  const isCalibrationExpired =
    tool.isCalibrationTool &&
    tool.nextCalibrationDate &&
    new Date(tool.nextCalibrationDate) < currentDate;

  if (isCalibrationExpired) return 'IN_CALIBRATION';
  return tool.status as EffectiveStatus;
}

export async function GET() {
  try {
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
      const effectiveStatus = calculateEffectiveStatus(tool, currentDate);

      // Vencimiento: solo aplica si la herramienta está IN_USE
      const expectedReturnDate =
        tool.status === Status.IN_USE && lastLog?.expectedReturnDate
          ? lastLog.expectedReturnDate.toISOString()
          : null;

      const isOverdue =
        tool.status === Status.IN_USE &&
        lastLog?.expectedReturnDate
          ? new Date(lastLog.expectedReturnDate) < currentDate
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
      };

      if (tool.status === Status.IN_USE) {
        rowData.who = lastLog?.user?.name || '---';
        rowData.where = lastLog?.clientJobId || '---';
      } else {
        rowData.who =
          effectiveStatus === 'IN_CALIBRATION'
            ? 'Requiere Calibración'
            : lastLog?.user?.name || '---';
        rowData.where = 'Showroom';
      }

      return rowData;
    });

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}