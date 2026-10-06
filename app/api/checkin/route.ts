import { NextResponse } from 'next/server';
import { apiErrorResponse, ApiError, readBody, requiredText, optionalText } from '@/app/lib/api-error';
import { inventoryTransaction } from '@/app/lib/transaction';

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const qrId = requiredText(body.qrId, 'QR');
    const workerId = requiredText(body.workerId, 'ID de trabajador');
    const comments = optionalText(body.comments);
    const result = await inventoryTransaction(async tx => {
      const user = await tx.user.findUnique({ where: { workerId } });
      if (!user) throw new ApiError(404, 'ID de Trabajador no encontrado');
      const tool = await tx.tool.findUnique({ where: { qrId }, include: { logs: { orderBy: { createdAt: 'desc' }, take: 1 } } });
      if (!tool) throw new ApiError(404, 'Herramienta no encontrada');
      if (tool.status !== 'IN_USE') throw new ApiError(409, 'Esta herramienta ya estaba disponible');
      const lastLog = tool.logs[0];
      if (lastLog?.clientJobId === 'CALIBRACION') throw new ApiError(409, 'La herramienta debe recibirse desde el panel de calibración');
      if (!lastLog || lastLog.type !== 'CHECK_OUT' || lastLog.userId !== user.id) {
        throw new ApiError(403, 'Solo el trabajador que retiró la herramienta puede devolverla');
      }
      const updatedTool = await tx.tool.update({ where: { id: tool.id, status: 'IN_USE' }, data: { status: 'AVAILABLE' } });
      const log = await tx.log.create({ data: { type: 'CHECK_IN', userId: user.id, toolId: tool.id, clientJobId: 'Showroom', comments } });
      return { tool: updatedTool, log };
    });
    return NextResponse.json({ message: 'Check-in exitoso', ...result });
  } catch (error) { return apiErrorResponse(error); }
}
