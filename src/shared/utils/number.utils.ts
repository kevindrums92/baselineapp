/**
 * Formatea un número con separadores de miles (puntos)
 * Ejemplo: 1000000 -> "1.000.000"
 */
export function formatNumberWithThousands(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '';

  return num.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}

/**
 * Parsea un número formateado (con separadores de miles) a número
 * Ejemplo: "1.000.000" -> 1000000
 */
export function parseFormattedNumber(value: string): number {
  // Remover todos los puntos (separadores de miles)
  const cleaned = value.replace(/\./g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
}
