/**
 * Días festivos oficiales de México (Art. 74 LFT).
 * Cubre 2025-2030. Actualiza esta lista en años futuros.
 *
 * Formato: 'YYYY-MM-DD' (zona horaria local, sin hora).
 */

export const HOLIDAYS_MX: ReadonlySet<string> = new Set([
  // 2025
  '2025-01-01', // Año Nuevo
  '2025-02-03', // Día de la Constitución (primer lunes de febrero)
  '2025-03-17', // Natalicio de Benito Juárez (tercer lunes de marzo)
  '2025-05-01', // Día del Trabajo
  '2025-09-16', // Día de la Independencia
  '2025-11-17', // Revolución Mexicana (tercer lunes de noviembre)
  '2025-12-25', // Navidad

  // 2026
  '2026-01-01',
  '2026-02-02', // primer lunes de febrero
  '2026-03-16', // tercer lunes de marzo
  '2026-05-01',
  '2026-09-16',
  '2026-11-16', // tercer lunes de noviembre
  '2026-12-25',

  // 2027
  '2027-01-01',
  '2027-02-01',
  '2027-03-15',
  '2027-05-01',
  '2027-09-16',
  '2027-11-15',
  '2027-12-25',

  // 2028
  '2028-01-01',
  '2028-02-07',
  '2028-03-20',
  '2028-05-01',
  '2028-09-16',
  '2028-11-20',
  '2028-12-25',

  // 2029
  '2029-01-01',
  '2029-02-05',
  '2029-03-19',
  '2029-05-01',
  '2029-09-16',
  '2029-11-19',
  '2029-12-25',

  // 2030
  '2030-01-01',
  '2030-02-04',
  '2030-03-18',
  '2030-05-01',
  '2030-09-16',
  '2030-11-18',
  '2030-12-25',
]);

/**
 * Devuelve la fecha como string YYYY-MM-DD en zona local
 * (para comparar contra HOLIDAYS_MX sin problemas de zona horaria).
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determina si una fecha es día festivo en México.
 */
export function isHolidayMX(date: Date): boolean {
  return HOLIDAYS_MX.has(toLocalDateString(date));
}
