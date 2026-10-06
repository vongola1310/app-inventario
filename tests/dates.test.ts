import { test } from 'node:test';
import assert from 'node:assert/strict';
import { businessDateKey, businessDayRange, calendarDate, isBusinessDate, nextBusinessDate, validDateKey } from '../app/lib/dates';

test('la fecha mínima es el mismo día hábil antes y después del mediodía', () => {
  assert.equal(nextBusinessDate(new Date('2026-10-06T09:00:00-06:00')), '2026-10-07');
  assert.equal(nextBusinessDate(new Date('2026-10-06T23:59:00-06:00')), '2026-10-07');
});

test('salta fines de semana, festivos y cambios de año', () => {
  assert.equal(nextBusinessDate(new Date('2026-11-13T18:00:00-06:00')), '2026-11-17');
  assert.equal(nextBusinessDate(new Date('2026-09-15T15:00:00-06:00')), '2026-09-17');
  assert.equal(nextBusinessDate(new Date('2026-12-31T15:00:00-06:00')), '2027-01-04');
  assert.equal(isBusinessDate('2026-10-10'), false);
});

test('usa el día de Ciudad de México aunque UTC ya esté en el día siguiente', () => {
  assert.equal(businessDateKey(new Date('2026-10-07T02:00:00Z')), '2026-10-06');
  const { start, end } = businessDayRange('2026-10-06');
  assert.equal(start.toISOString(), '2026-10-06T06:00:00.000Z');
  assert.equal(end.toISOString(), '2026-10-07T06:00:00.000Z');
});

test('rechaza fechas inexistentes y conserva el día de calendario al guardar', () => {
  for (const value of ['2026-02-30', '2026-13-01', '2026-2-01', '', null, 123]) assert.equal(validDateKey(value), false);
  assert.equal(validDateKey('2028-02-29'), true);
  assert.equal(calendarDate('2026-10-07').toISOString(), '2026-10-07T00:00:00.000Z');
});
