import { isHolidayMX } from './holidays-mx';

/**
 * Suma N días hábiles a una fecha, saltando fines de semana
 * (sábado y domingo) y días festivos oficiales de México.
 *
 * Ejemplo:
 *   addBusinessDays(viernes, 1)        → lunes
 *   addBusinessDays(15-sep, 1)         → 17-sep (16-sep es festivo)
 *   addBusinessDays(viernes-festivo,1) → siguiente día hábil
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  if (days < 0) {
    throw new Error('addBusinessDays solo acepta días positivos');
  }

  const result = new Date(startDate);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      added++;
    }
  }

  return result;
}

/**
 * Determina si una fecha es día hábil
 * (no sábado, no domingo, no festivo MX).
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  if (isHolidayMX(date)) return false;
  return true;
}