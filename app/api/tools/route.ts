import { calendarDate, validDateKey } from '@/app/lib/dates';
import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse, ApiError, readBody, requiredText } from '@/app/lib/api-error';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Status } from '@prisma/client';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await readBody(request);
    const name = requiredText(body.name, 'nombre');
    const qrId = requiredText(body.qrId, 'QR');
    const { isCalibrationTool, nextCalibrationDate } = body;
    if (typeof isCalibrationTool !== 'boolean') throw new ApiError(400, 'Indicador de calibración inválido');
    if (nextCalibrationDate && !validDateKey(nextCalibrationDate)) throw new ApiError(400, 'Fecha de calibración inválida');

    // Validación básica
    if (!name || !qrId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (name, qrId)' },
        { status: 400 }
      );
    }

    const existingTool = await prisma.tool.findUnique({ where: { qrId } });
    if (existingTool) {
      return NextResponse.json(
        { error: `Ya existe una herramienta con el QR ID ${qrId}` },
        { status: 409 }
      );
    }

    // --- EL OBJETO DE CREACIÓN DEBE SER EXPLÍCITO ---
    const newTool = await prisma.tool.create({
      data: {
        name,
        qrId,
        status: Status.AVAILABLE,
        // Usamos la propiedad que ya está definida en ToolCreateInput
        isCalibrationTool: !!isCalibrationTool,
        nextCalibrationDate: isCalibrationTool && validDateKey(nextCalibrationDate) ? calendarDate(nextCalibrationDate) : null,
      },
    });
    // ------------------------------------------------

    return NextResponse.json(newTool, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
