import { HOLIDAYS_MX } from './holidays-mx';

export const BUSINESS_TIME_ZONE = 'America/Mexico_City';

export function businessDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isBusinessDate(key: string): boolean {
  if (!validDateKey(key)) return false;
  const day = new Date(`${key}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6 && !HOLIDAYS_MX.has(key);
}

export function nextBusinessDate(now = new Date()): string {
  const date = new Date(`${businessDateKey(now)}T00:00:00Z`);
  do { date.setUTCDate(date.getUTCDate() + 1); } while (!isBusinessDate(date.toISOString().slice(0, 10)));
  return date.toISOString().slice(0, 10);
}

// Guardar fechas de calendario como UTC, separadas de los instantes del historial.
export function calendarDate(key: string): Date {
  if (!validDateKey(key)) throw new Error('Fecha inválida');
  return new Date(`${key}T00:00:00Z`);
}

export function formatCalendarDate(value: string): string {
  return calendarDate(value.slice(0, 10)).toLocaleDateString('es-MX', { timeZone: 'UTC' });
}

export function businessDayRange(key: string): { start: Date; end: Date } {
  const midnight = calendarDate(key);
  const startOfDay = (date: Date) => {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE, timeZoneName: 'longOffset',
    }).formatToParts(date).find(p => p.type === 'timeZoneName')!.value;
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset);
    const minutes = match ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1) : 0;
    return new Date(date.getTime() - minutes * 60_000);
  };
  return { start: startOfDay(midnight), end: startOfDay(new Date(midnight.getTime() + 86_400_000)) };
}
