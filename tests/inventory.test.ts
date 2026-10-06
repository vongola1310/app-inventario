import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../app/lib/prisma';
import { inventoryTransaction } from '../app/lib/transaction';
import { POST as checkout } from '../app/api/checkout/route';
import { POST as checkin } from '../app/api/checkin/route';
import { RESPONSIVA } from '../app/lib/responsiva';
import { nextBusinessDate } from '../app/lib/dates';

const originalTransaction = prisma.$transaction;
function mockTransaction<T extends (...args: never[]) => unknown>(implementation: T) {
  const stub = mock.fn(implementation);
  prisma.$transaction = stub as unknown as typeof prisma.$transaction;
  return stub;
}
afterEach(() => { prisma.$transaction = originalTransaction; mock.restoreAll(); });

test('reintenta conflictos serializables con un límite y exige aislamiento Serializable', async () => {
  let attempts = 0;
  mockTransaction(async (_operation: unknown, options: { isolationLevel: string }) => {
    assert.equal(options.isolationLevel, 'Serializable');
    attempts++;
    if (attempts < 3) throw new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '6.19.0' });
    return 'ok';
  });
  assert.equal(await inventoryTransaction(async () => 'ok'), 'ok');
  assert.equal(attempts, 3);
});

test('no reintenta errores de negocio ni deja un bucle ante conflictos persistentes', async () => {
  const failure = new Error('Error de negocio');
  const transaction = mockTransaction(async () => { throw failure; });
  await assert.rejects(inventoryTransaction(async () => null), failure);
  assert.equal(transaction.mock.callCount(), 1);
  transaction.mock.restore();
  const conflict = mockTransaction(async () => {
    throw new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '6.19.0' });
  });
  await assert.rejects(inventoryTransaction(async () => null));
  assert.equal(conflict.mock.callCount(), 3);
});

const request = (body: unknown) => new Request('http://localhost/api/checkout', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('rechaza fechas inválidas y una responsiva antigua antes de escribir en la base', async () => {
  const transaction = mockTransaction(async () => { throw new Error('No debe acceder a la base'); });
  const body = { qrId: 'QR-1', workerId: 'EMP-1', responsivaAccepted: true, responsivaVersion: RESPONSIVA.version };
  assert.equal((await checkout(request({ ...body, expectedReturnDate: '2026-02-30' }))).status, 400);
  assert.equal((await checkout(request({ ...body, responsivaVersion: 'obsoleta' }))).status, 400);
  assert.equal((await checkout(request(null))).status, 400);
  assert.equal((await checkin(request({ qrId: {}, workerId: 'EMP-1' }))).status, 400);
  assert.equal(transaction.mock.callCount(), 0);
});

test('un segundo préstamo de una herramienta ocupada no crea un movimiento', async () => {
  const tx = {
    user: { findUnique: async () => ({ id: 'user-1' }) },
    tool: { findUnique: async () => ({ id: 'tool-1', status: 'IN_USE', isCalibrationTool: false }) },
    log: { create: mock.fn() },
  };
  mockTransaction(async (operation: (client: unknown) => Promise<unknown>) => operation(tx));
  const response = await checkout(request({ qrId: 'QR-1', workerId: 'EMP-1', responsivaAccepted: true, responsivaVersion: RESPONSIVA.version, expectedReturnDate: nextBusinessDate() }));
  assert.equal(response.status, 409);
  assert.equal(tx.log.create.mock.callCount(), 0);
});

test('una devolución por otro trabajador o desde laboratorio no libera la herramienta', async () => {
  const tool = { id: 'tool-1', status: 'IN_USE', logs: [{ type: 'CHECK_OUT', userId: 'other', clientJobId: 'Cliente' }] };
  const tx = {
    user: { findUnique: async () => ({ id: 'user-1' }) },
    tool: { findUnique: async () => tool, update: mock.fn() },
  };
  mockTransaction(async (operation: (client: unknown) => Promise<unknown>) => operation(tx));
  assert.equal((await checkin(request({ qrId: 'QR-1', workerId: 'EMP-1' }))).status, 403);
  tool.logs[0].clientJobId = 'CALIBRACION';
  assert.equal((await checkin(request({ qrId: 'QR-1', workerId: 'EMP-1' }))).status, 409);
  assert.equal(tx.tool.update.mock.callCount(), 0);
});
