import { NextResponse } from 'next/server';
import { apiErrorResponse, ApiError, readBody, requiredText, optionalText } from '@/app/lib/api-error';
import { inventoryTransaction } from '@/app/lib/transaction';
import { businessDateKey, calendarDate, isBusinessDate, nextBusinessDate, validDateKey } from '@/app/lib/dates';
import { RESPONSIVA } from '@/app/lib/responsiva';

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const qrId = requiredText(body.qrId, 'QR');
    const workerId = requiredText(body.workerId, 'ID de trabajador');
    const clientName = optionalText(body.clientName);
    if (clientName?.toUpperCase() === 'CALIBRACION') throw new ApiError(400, 'Los envíos a calibración se registran desde el inventario');
    if (body.responsivaAccepted !== true || body.responsivaVersion !== RESPONSIVA.version) {
      throw new ApiError(400, 'Debes aceptar la versión vigente de la carta responsiva');
    }
    const minimum = nextBusinessDate();
    const requested = body.expectedReturnDate ?? minimum;
    if (!validDateKey(requested)) throw new ApiError(400, 'Fecha de retorno inválida. Usa YYYY-MM-DD');
    if (requested < minimum) throw new ApiError(400, `La fecha de retorno debe ser igual o posterior a ${minimum}`);
    if (!isBusinessDate(requested)) throw new ApiError(400, 'La fecha de retorno debe ser un día hábil');
    const expectedReturnDate = calendarDate(requested);

    const result = await inventoryTransaction(async tx => {
      const user = await tx.user.findUnique({ where: { workerId } });
      if (!user) throw new ApiError(404, 'ID de Trabajador no encontrado');
      const tool = await tx.tool.findUnique({ where: { qrId } });
      if (!tool) throw new ApiError(404, 'Herramienta no encontrada');
      if (tool.isCalibrationTool && (!tool.nextCalibrationDate || tool.nextCalibrationDate.toISOString().slice(0, 10) < businessDateKey())) {
        throw new ApiError(403, 'La herramienta requiere calibración vigente antes de prestarse');
      }
      if (tool.status !== 'AVAILABLE') throw new ApiError(409, 'Esta herramienta ya está en uso');
      const updatedTool = await tx.tool.update({ where: { id: tool.id, status: 'AVAILABLE' }, data: { status: 'IN_USE' } });
      const log = await tx.log.create({ data: {
        type: 'CHECK_OUT', clientJobId: clientName, userId: user.id, toolId: tool.id,
        responsivaAccepted: true, responsivaVersion: RESPONSIVA.version, expectedReturnDate,
      } });
      return { tool: updatedTool, log };
    });
    return NextResponse.json({ message: 'Check-out exitoso', ...result, expectedReturnDate: expectedReturnDate.toISOString() });
  } catch (error) { return apiErrorResponse(error); }
}
