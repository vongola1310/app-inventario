import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status } from '@prisma/client';

// 1. Definición del tipo visual
type EffectiveStatus = 'AVAILABLE' | 'IN_USE' | 'IN_CALIBRATION' | 'EXPIRED';

/**
 * Función para calcular el estado efectivo
 */
function calculateEffectiveStatus(tool: any, currentDate: Date, isAtLab: boolean): EffectiveStatus {
    if (isAtLab) {
        return 'IN_CALIBRATION';
    }

    const isCalibrationExpired = tool.isCalibrationTool && tool.nextCalibrationDate && new Date(tool.nextCalibrationDate) < currentDate;

    if (isCalibrationExpired && tool.status === Status.AVAILABLE) {
        return 'EXPIRED';
    }
    
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
          isCalibrationTool: true, // Importante
          nextCalibrationDate: true,
          logs: {
              orderBy: { createdAt: 'desc' },
              take: 1, 
              include: {
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
      const timestamp = lastLog?.createdAt || null;
      const isAtLab = tool.status === Status.IN_USE && where.toUpperCase().includes('CALIBRACI');

      const effectiveStatus = calculateEffectiveStatus(tool, currentDate, isAtLab);
      
      // Objeto base
      const rowData = {
        id: tool.id,
        name: tool.name,
        qrId: tool.qrId,
        status: tool.status, 
        effectiveStatus: effectiveStatus,
        isCalibrationTool: tool.isCalibrationTool, // <--- ¡AÑADIDO! Enviamos este dato al frontend
        timestamp: timestamp,
        nextCalibrationDate: tool.nextCalibrationDate?.toISOString() || null,
        who: '---',
        where: '---',
        isAtLab: isAtLab,
      };

      // Lógica de llenado de datos según estado
      if (isAtLab) {
          rowData.who = lastLog?.user?.name || 'Admin';
          rowData.where = 'Laboratorio de Calibración';
      } else if (tool.status === Status.IN_USE) {
          rowData.who = who;
          rowData.where = where;
      } else {
          // Disponible o Vencida
          rowData.who = effectiveStatus === 'EXPIRED' ? 'Requiere Calibración' : (lastLog?.user?.name || '---');
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