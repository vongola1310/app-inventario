/**
 * Carta Responsiva — Texto legal y versionado
 *
 * Cada vez que modifiques el contenido del texto, INCREMENTA `version`.
 * La versión vigente se guarda en cada Log de CHECK_OUT, de modo que
 * los registros históricos quedan ligados al texto que el ingeniero
 * efectivamente aceptó en ese momento (auditable hacia atrás).
 *
 * Formato sugerido de versión: vMAJOR.MINOR-YYYY-MM
 */

export const RESPONSIVA = {
  version: 'v1.0-2026-05',
  effectiveDate: '2026-05-01',
  title: 'Carta Responsiva — Préstamo de Herramienta',
  shortNotice:
    'Sacar una herramienta tiene validez de carta responsiva firmada.',
  body: `Al confirmar este registro, el suscrito reconoce que recibe en
calidad de préstamo la herramienta identificada por el código QR escaneado, y
se compromete a:

1. Utilizar la herramienta exclusivamente para los fines del trabajo o
cliente declarado en este registro.

2. Conservarla en las mismas condiciones físicas y de funcionamiento en que
la recibe, devolviéndola al Showroom dentro del plazo establecido.

3. Reportar de inmediato cualquier daño, falla, pérdida o extravío al área
de Administración.

4. Responder económicamente por cualquier daño, pérdida o uso indebido
imputable a su persona durante el periodo de préstamo, conforme a las
políticas internas de la empresa.

Este registro electrónico, asociado al ID de Trabajador y al código QR
escaneado, constituye prueba suficiente del compromiso adquirido y tiene la
misma validez que una carta responsiva física firmada de puño y letra.`,
} as const;

export type ResponsivaInfo = typeof RESPONSIVA;