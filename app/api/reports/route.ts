import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { differenceInBusinessDays, differenceInDays, startOfYear, endOfYear, isBefore, isAfter, min, max, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  try {
    const tools = await prisma.tool.findMany({
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const totalBusinessDays = differenceInBusinessDays(yearEnd, yearStart) || 1;
    const today = new Date();

    const reports = tools.map(tool => {
      let usedDays = 0;
      let calibrationDays = 0;
      let calibrationCount = 0;

      let currentCheckoutDate: Date | null = null;
      let isCalibration = false;
      let lastCalibrationCheckout: Date | null = null;

      const relevantLogs = tool.logs;

      relevantLogs.forEach(log => {
        const logDate = log.createdAt;

        if (log.type === 'CHECK_OUT') {
          currentCheckoutDate = logDate;
          isCalibration = log.clientJobId?.toUpperCase().includes('CALIBRACI') || false;
          if (isCalibration) lastCalibrationCheckout = logDate;
        } else if (log.type === 'CHECK_IN' && currentCheckoutDate) {
          const start = max([currentCheckoutDate, yearStart]);
          const end = min([logDate, yearEnd]);

          if (isBefore(start, end)) {
            const days = differenceInBusinessDays(end, start);
            if (isCalibration) {
              calibrationDays += days;
              calibrationCount++;
            } else {
              usedDays += days;
            }
          }
          currentCheckoutDate = null;
          isCalibration = false;
        }
      });

      // Ongoing checkout
      if (currentCheckoutDate) {
        const start = max([currentCheckoutDate, yearStart]);
        const end = min([today, yearEnd]); 
        
        if (isBefore(start, end)) {
          const days = Math.max(0, differenceInBusinessDays(end, start));
          if (isCalibration) {
            calibrationDays += days;
            // No incrementamos calibrationCount hasta que regrese para no sesgar el promedio, o lo podemos contar.
            // Lo dejaremos así.
          } else {
            usedDays += days;
          }
        }
      }

      // Se calculará más abajo cuando tengamos expiredDays
      let unusedDays = 0;

      // --- Nuevas Métricas de Calibración ---
      let daysToExpiration = null;
      let delayInSending = null;
      let currentCalibrationDuration = null;

      if (tool.isCalibrationTool && tool.nextCalibrationDate) {
        daysToExpiration = differenceInDays(tool.nextCalibrationDate, today);
        
        // Si está actualmente en calibración (checkout = CALIBRACION)
        if (currentCheckoutDate && isCalibration) {
          // El retraso es desde que venció hasta que se mandó
          delayInSending = Math.max(0, differenceInBusinessDays(currentCheckoutDate, tool.nextCalibrationDate));
          currentCalibrationDuration = differenceInBusinessDays(today, currentCheckoutDate);
        } else {
          // Si no está en calibración, revisamos si ya está vencida
          if (daysToExpiration < 0) {
            // Está vencida y aún no se manda, el retraso sigue creciendo hasta hoy
            delayInSending = Math.max(0, differenceInBusinessDays(today, tool.nextCalibrationDate));
          }
        }
      }

      let expiredDays = delayInSending || 0;
      unusedDays = Math.max(0, totalBusinessDays - usedDays - calibrationDays - expiredDays);

      return {
        id: tool.id,
        name: tool.name,
        qrId: tool.qrId,
        isCalibrationTool: tool.isCalibrationTool,
        nextCalibrationDate: tool.nextCalibrationDate,
        metrics: {
          totalBusinessDays,
          usedDays,
          calibrationDays,
          unusedDays,
          usedPercent: ((usedDays / totalBusinessDays) * 100).toFixed(1),
          calibrationPercent: ((calibrationDays / totalBusinessDays) * 100).toFixed(1),
          expiredPercent: ((expiredDays / totalBusinessDays) * 100).toFixed(1),
          unusedPercent: ((unusedDays / totalBusinessDays) * 100).toFixed(1),
          avgCalibrationTime: calibrationCount > 0 ? (calibrationDays / calibrationCount).toFixed(1) : (currentCheckoutDate && isCalibration ? currentCalibrationDuration?.toString() : "0"),
          daysToExpiration,
          delayInSending,
          currentCalibrationDuration
        }
      };
    });

    let globalUsed = 0;
    let globalCalibration = 0;
    let globalExpired = 0;
    let globalUnused = 0;
    
    reports.forEach(r => {
      globalUsed += r.metrics.usedDays;
      globalCalibration += r.metrics.calibrationDays;
      globalExpired += (r.metrics.delayInSending || 0);
      globalUnused += r.metrics.unusedDays;
    });

    const globalTotal = globalUsed + globalCalibration + globalExpired + globalUnused || 1;

    const summary = {
      usedPercent: ((globalUsed / globalTotal) * 100).toFixed(1),
      calibrationPercent: ((globalCalibration / globalTotal) * 100).toFixed(1),
      expiredPercent: ((globalExpired / globalTotal) * 100).toFixed(1),
      unusedPercent: ((globalUnused / globalTotal) * 100).toFixed(1),
    };

    return NextResponse.json({ year, totalBusinessDays, summary, tools: reports }, { status: 200 });

  } catch (error) {
    console.error('Error fetching utilization report:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
