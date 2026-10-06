import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAdmin } from '@/app/lib/admin-auth';
import { apiErrorResponse, ApiError, readBody, requiredText } from '@/app/lib/api-error';
import { inventoryTransaction } from '@/app/lib/transaction';
import { businessDateKey, calendarDate, validDateKey } from '@/app/lib/dates';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action, nextCalibrationDate } = await readBody(request);
    if (action !== undefined && action !== 'SEND_TO_CALIBRATION' && action !== 'RECEIVE_FROM_CALIBRATION') {
      throw new ApiError(400, 'Acción inválida');
    }
    if (action !== 'SEND_TO_CALIBRATION' && (!validDateKey(nextCalibrationDate) || nextCalibrationDate < businessDateKey())) {
      throw new ApiError(400, 'Se requiere una fecha de calibración válida, igual o posterior a hoy');
    }
    const updatedTool = await inventoryTransaction(async tx => {
      const tool = await tx.tool.findUnique({ where: { id }, include: { logs: { orderBy: { createdAt: 'desc' }, take: 1 } } });
      if (!tool) throw new ApiError(404, 'Herramienta no encontrada');
      if (!tool.isCalibrationTool) throw new ApiError(400, 'Esta herramienta no requiere calibración');
      const isAtLab = tool.status === 'IN_USE' && tool.logs[0]?.type === 'CHECK_OUT' && tool.logs[0]?.clientJobId === 'CALIBRACION';
      if (action === 'SEND_TO_CALIBRATION') {
        if (tool.status !== 'AVAILABLE') throw new ApiError(409, 'La herramienta está prestada o ya está en calibración');
        const updated = await tx.tool.update({ where: { id, status: 'AVAILABLE' }, data: { status: 'IN_USE' } });
        await tx.log.create({ data: { type: 'CHECK_OUT', clientJobId: 'CALIBRACION', userId: admin.id, toolId: id } });
        return updated;
      }
      if (action === 'RECEIVE_FROM_CALIBRATION' && !isAtLab) throw new ApiError(409, 'La herramienta no está en el laboratorio');
      if (action === undefined && tool.status !== 'AVAILABLE') throw new ApiError(409, 'No puedes renovar una herramienta prestada');
      const updated = await tx.tool.update({ where: { id }, data: {
        nextCalibrationDate: calendarDate(nextCalibrationDate as string),
        ...(isAtLab ? { status: 'AVAILABLE' as const } : {}),
      } });
      if (isAtLab) await tx.log.create({ data: { type: 'CHECK_IN', clientJobId: 'REGRESO_CALIBRACION', userId: admin.id, toolId: id } });
      return updated;
    });
    return NextResponse.json(updatedTool);
  } catch (error) { return apiErrorResponse(error); }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await readBody(request);
    const name = requiredText(body.name, 'nombre');
    const qrId = requiredText(body.qrId, 'QR');
    if (typeof body.isCalibrationTool !== 'boolean') throw new ApiError(400, 'Indicador de calibración inválido');
    if (body.nextCalibrationDate && !validDateKey(body.nextCalibrationDate)) throw new ApiError(400, 'Fecha de calibración inválida');
    const updatedTool = await prisma.tool.update({ where: { id }, data: {
      name, qrId, isCalibrationTool: body.isCalibrationTool,
      nextCalibrationDate: body.isCalibrationTool && validDateKey(body.nextCalibrationDate) ? calendarDate(body.nextCalibrationDate) : null,
    } });
    return NextResponse.json(updatedTool);
  } catch (error) { return apiErrorResponse(error); }
}
