/**
 * Currency formatting utilities
 */

/**
 * Format number as Colombian Pesos (COP) with thousand separators
 *
 * @example
 * formatCOP(1500000) // "$ 1.500.000"
 * formatCOP(45000) // "$ 45.000"
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
