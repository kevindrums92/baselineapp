/**
 * String utility functions
 */

/**
 * Convert kebab-case string to PascalCase
 * Used for converting icon names to React component names
 *
 * @example
 * kebabToPascal("shopping-bag") // "ShoppingBag"
 * kebabToPascal("credit-card") // "CreditCard"
 */
export function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
