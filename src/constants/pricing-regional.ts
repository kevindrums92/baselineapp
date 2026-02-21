export type RegionalPrice = {
  monthly: number;
  annual: number;
  lifetime: number;
  currency: string;
};

export const REGIONAL_PRICING: Record<string, RegionalPrice> = {
  CO: { monthly: 14900, annual: 119900, lifetime: 299900, currency: 'COP' },
  BR: { monthly: 19.90, annual: 149.00, lifetime: 399.00, currency: 'BRL' },
  MX: { monthly: 89, annual: 699, lifetime: 1799, currency: 'MXN' },
  AR: { monthly: 2499, annual: 19999, lifetime: 49999, currency: 'ARS' },
  CL: { monthly: 3990, annual: 29990, lifetime: 74990, currency: 'CLP' },
  PE: { monthly: 14.90, annual: 109.90, lifetime: 289.90, currency: 'PEN' },
};
