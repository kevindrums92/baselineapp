/**
 * Currency Constants
 * Definiciones de 50+ monedas mundiales con metadata completa
 */

export type CurrencyRegion = 'america' | 'europe' | 'asia' | 'africa';

export interface CurrencyInfo {
  code: string;           // ISO 4217 code (e.g., "COP", "USD")
  symbol: string;         // Currency symbol (e.g., "$", "€")
  name: string;           // Spanish name
  flag: string;           // Flag emoji
  locale: string;         // Intl locale for formatting
  decimals: number;       // Decimal places (0 for COP, 2 for USD)
  region: CurrencyRegion; // For grouping in picker
}

export const CURRENCY_REGIONS: Record<CurrencyRegion, { labelEs: string; labelEn: string }> = {
  america: { labelEs: 'América', labelEn: 'Americas' },
  europe: { labelEs: 'Europa', labelEn: 'Europe' },
  asia: { labelEs: 'Asia-Pacífico', labelEn: 'Asia-Pacific' },
  africa: { labelEs: 'Medio Oriente y África', labelEn: 'Middle East & Africa' },
};

export const STORAGE_KEY = 'app_currency';
export const DEFAULT_CURRENCY = 'COP';

export const CURRENCIES: CurrencyInfo[] = [
  // América
  { code: 'COP', symbol: '$', name: 'Peso Colombiano', flag: '🇨🇴', locale: 'es-CO', decimals: 0, region: 'america' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', flag: '🇺🇸', locale: 'en-US', decimals: 2, region: 'america' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadiense', flag: '🇨🇦', locale: 'en-CA', decimals: 2, region: 'america' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano', flag: '🇲🇽', locale: 'es-MX', decimals: 2, region: 'america' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', flag: '🇧🇷', locale: 'pt-BR', decimals: 2, region: 'america' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', flag: '🇦🇷', locale: 'es-AR', decimals: 2, region: 'america' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno', flag: '🇨🇱', locale: 'es-CL', decimals: 0, region: 'america' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', flag: '🇵🇪', locale: 'es-PE', decimals: 2, region: 'america' },
  { code: 'UYU', symbol: '$', name: 'Peso Uruguayo', flag: '🇺🇾', locale: 'es-UY', decimals: 2, region: 'america' },
  { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezolano', flag: '🇻🇪', locale: 'es-VE', decimals: 2, region: 'america' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', flag: '🇬🇹', locale: 'es-GT', decimals: 2, region: 'america' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', flag: '🇩🇴', locale: 'es-DO', decimals: 2, region: 'america' },

  // Europa
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'es-ES', decimals: 2, region: 'europe' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', flag: '🇬🇧', locale: 'en-GB', decimals: 2, region: 'europe' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suizo', flag: '🇨🇭', locale: 'de-CH', decimals: 2, region: 'europe' },
  { code: 'SEK', symbol: 'kr', name: 'Corona Sueca', flag: '🇸🇪', locale: 'sv-SE', decimals: 2, region: 'europe' },
  { code: 'NOK', symbol: 'kr', name: 'Corona Noruega', flag: '🇳🇴', locale: 'nb-NO', decimals: 2, region: 'europe' },
  { code: 'DKK', symbol: 'kr', name: 'Corona Danesa', flag: '🇩🇰', locale: 'da-DK', decimals: 2, region: 'europe' },
  { code: 'PLN', symbol: 'zł', name: 'Zloty Polaco', flag: '🇵🇱', locale: 'pl-PL', decimals: 2, region: 'europe' },
  { code: 'CZK', symbol: 'Kč', name: 'Corona Checa', flag: '🇨🇿', locale: 'cs-CZ', decimals: 2, region: 'europe' },
  { code: 'HUF', symbol: 'Ft', name: 'Florín Húngaro', flag: '🇭🇺', locale: 'hu-HU', decimals: 0, region: 'europe' },
  { code: 'RON', symbol: 'lei', name: 'Leu Rumano', flag: '🇷🇴', locale: 'ro-RO', decimals: 2, region: 'europe' },
  { code: 'RUB', symbol: '₽', name: 'Rublo Ruso', flag: '🇷🇺', locale: 'ru-RU', decimals: 2, region: 'europe' },
  { code: 'TRY', symbol: '₺', name: 'Lira Turca', flag: '🇹🇷', locale: 'tr-TR', decimals: 2, region: 'europe' },

  // Asia-Pacífico
  { code: 'CNY', symbol: '¥', name: 'Yuan Chino', flag: '🇨🇳', locale: 'zh-CN', decimals: 2, region: 'asia' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonés', flag: '🇯🇵', locale: 'ja-JP', decimals: 0, region: 'asia' },
  { code: 'KRW', symbol: '₩', name: 'Won Surcoreano', flag: '🇰🇷', locale: 'ko-KR', decimals: 0, region: 'asia' },
  { code: 'INR', symbol: '₹', name: 'Rupia India', flag: '🇮🇳', locale: 'hi-IN', decimals: 2, region: 'asia' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano', flag: '🇦🇺', locale: 'en-AU', decimals: 2, region: 'asia' },
  { code: 'NZD', symbol: 'NZ$', name: 'Dólar Neozelandés', flag: '🇳🇿', locale: 'en-NZ', decimals: 2, region: 'asia' },
  { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapur', flag: '🇸🇬', locale: 'en-SG', decimals: 2, region: 'asia' },
  { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong', flag: '🇭🇰', locale: 'zh-HK', decimals: 2, region: 'asia' },
  { code: 'TWD', symbol: 'NT$', name: 'Dólar Taiwanés', flag: '🇹🇼', locale: 'zh-TW', decimals: 2, region: 'asia' },
  { code: 'THB', symbol: '฿', name: 'Baht Tailandés', flag: '🇹🇭', locale: 'th-TH', decimals: 2, region: 'asia' },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit Malayo', flag: '🇲🇾', locale: 'ms-MY', decimals: 2, region: 'asia' },
  { code: 'IDR', symbol: 'Rp', name: 'Rupia Indonesia', flag: '🇮🇩', locale: 'id-ID', decimals: 0, region: 'asia' },
  { code: 'PHP', symbol: '₱', name: 'Peso Filipino', flag: '🇵🇭', locale: 'en-PH', decimals: 2, region: 'asia' },
  { code: 'VND', symbol: '₫', name: 'Dong Vietnamita', flag: '🇻🇳', locale: 'vi-VN', decimals: 0, region: 'asia' },
  { code: 'PKR', symbol: '₨', name: 'Rupia Pakistaní', flag: '🇵🇰', locale: 'ur-PK', decimals: 2, region: 'asia' },

  // Medio Oriente y África
  { code: 'SAR', symbol: '﷼', name: 'Riyal Saudí', flag: '🇸🇦', locale: 'ar-SA', decimals: 2, region: 'africa' },
  { code: 'AED', symbol: 'د.إ', name: 'Dirham Emiratí', flag: '🇦🇪', locale: 'ar-AE', decimals: 2, region: 'africa' },
  { code: 'ILS', symbol: '₪', name: 'Shekel Israelí', flag: '🇮🇱', locale: 'he-IL', decimals: 2, region: 'africa' },
  { code: 'ZAR', symbol: 'R', name: 'Rand Sudafricano', flag: '🇿🇦', locale: 'en-ZA', decimals: 2, region: 'africa' },
  { code: 'EGP', symbol: '£', name: 'Libra Egipcia', flag: '🇪🇬', locale: 'ar-EG', decimals: 2, region: 'africa' },
  { code: 'NGN', symbol: '₦', name: 'Naira Nigeriana', flag: '🇳🇬', locale: 'en-NG', decimals: 2, region: 'africa' },
  { code: 'KES', symbol: 'KSh', name: 'Chelín Keniano', flag: '🇰🇪', locale: 'en-KE', decimals: 2, region: 'africa' },
  { code: 'MAD', symbol: 'د.م.', name: 'Dirham Marroquí', flag: '🇲🇦', locale: 'ar-MA', decimals: 2, region: 'africa' },
];

/**
 * Get currency info by code
 */
export function getCurrencyByCode(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

/**
 * Get currencies filtered by region
 */
export function getCurrenciesByRegion(region: CurrencyRegion): CurrencyInfo[] {
  return CURRENCIES.filter((c) => c.region === region);
}

/**
 * Search currencies by code, name, or flag
 */
export function searchCurrencies(query: string): CurrencyInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return CURRENCIES;

  return CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
  );
}
