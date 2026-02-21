/**
 * Currency Detection
 * Detecta automáticamente la moneda basada en timezone y locale del dispositivo
 */

import { DEFAULT_CURRENCY, getCurrencyByCode, type CurrencyInfo } from './currency.constants';

/**
 * Mapeo de timezone a código de moneda
 */
const TIMEZONE_CURRENCY_MAP: Record<string, string> = {
  // América
  'America/Bogota': 'COP',
  'America/New_York': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Phoenix': 'USD',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Mexico_City': 'MXN',
  'America/Cancun': 'MXN',
  'America/Tijuana': 'MXN',
  'America/Sao_Paulo': 'BRL',
  'America/Rio_Branco': 'BRL',
  'America/Buenos_Aires': 'ARS',
  'America/Argentina/Buenos_Aires': 'ARS',
  'America/Santiago': 'CLP',
  'America/Lima': 'PEN',
  'America/Montevideo': 'UYU',
  'America/Caracas': 'VES',
  'America/Guatemala': 'GTQ',
  'America/Santo_Domingo': 'DOP',

  // Europa
  'Europe/Madrid': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/London': 'GBP',
  'Europe/Zurich': 'CHF',
  'Europe/Stockholm': 'SEK',
  'Europe/Oslo': 'NOK',
  'Europe/Copenhagen': 'DKK',
  'Europe/Warsaw': 'PLN',
  'Europe/Prague': 'CZK',
  'Europe/Budapest': 'HUF',
  'Europe/Bucharest': 'RON',
  'Europe/Moscow': 'RUB',
  'Europe/Istanbul': 'TRY',

  // Asia-Pacífico
  'Asia/Shanghai': 'CNY',
  'Asia/Hong_Kong': 'HKD',
  'Asia/Tokyo': 'JPY',
  'Asia/Seoul': 'KRW',
  'Asia/Kolkata': 'INR',
  'Asia/Singapore': 'SGD',
  'Asia/Taipei': 'TWD',
  'Asia/Bangkok': 'THB',
  'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Jakarta': 'IDR',
  'Asia/Manila': 'PHP',
  'Asia/Ho_Chi_Minh': 'VND',
  'Asia/Karachi': 'PKR',
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Pacific/Auckland': 'NZD',

  // Medio Oriente y África
  'Asia/Riyadh': 'SAR',
  'Asia/Dubai': 'AED',
  'Asia/Jerusalem': 'ILS',
  'Africa/Johannesburg': 'ZAR',
  'Africa/Cairo': 'EGP',
  'Africa/Lagos': 'NGN',
  'Africa/Nairobi': 'KES',
  'Africa/Casablanca': 'MAD',
};

/**
 * Mapeo de locale a código de moneda
 */
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'es-CO': 'COP',
  'es-MX': 'MXN',
  'es-AR': 'ARS',
  'es-CL': 'CLP',
  'es-PE': 'PEN',
  'es-UY': 'UYU',
  'es-VE': 'VES',
  'es-GT': 'GTQ',
  'es-DO': 'DOP',
  'es-ES': 'EUR',
  'pt-BR': 'BRL',
  'en-US': 'USD',
  'en-CA': 'CAD',
  'en-GB': 'GBP',
  'en-AU': 'AUD',
  'en-NZ': 'NZD',
  'en-SG': 'SGD',
  'en-ZA': 'ZAR',
  'en-NG': 'NGN',
  'en-KE': 'KES',
  'en-PH': 'PHP',
  'fr-FR': 'EUR',
  'fr-CA': 'CAD',
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'de-CH': 'CHF',
  'it-IT': 'EUR',
  'nl-NL': 'EUR',
  'nl-BE': 'EUR',
  'sv-SE': 'SEK',
  'nb-NO': 'NOK',
  'da-DK': 'DKK',
  'pl-PL': 'PLN',
  'cs-CZ': 'CZK',
  'hu-HU': 'HUF',
  'ro-RO': 'RON',
  'ru-RU': 'RUB',
  'tr-TR': 'TRY',
  'zh-CN': 'CNY',
  'zh-TW': 'TWD',
  'zh-HK': 'HKD',
  'ja-JP': 'JPY',
  'ko-KR': 'KRW',
  'hi-IN': 'INR',
  'th-TH': 'THB',
  'ms-MY': 'MYR',
  'id-ID': 'IDR',
  'vi-VN': 'VND',
  'ar-SA': 'SAR',
  'ar-AE': 'AED',
  'ar-EG': 'EGP',
  'ar-MA': 'MAD',
  'he-IL': 'ILS',
};

/**
 * Detecta la moneda basada en timezone y locale del dispositivo
 * @returns Código de moneda detectado o DEFAULT_CURRENCY
 */
export function detectCurrency(): string {
  // 1. Intentar detección por timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && TIMEZONE_CURRENCY_MAP[timezone]) {
      console.log('[Currency] Detected from timezone:', timezone, '->', TIMEZONE_CURRENCY_MAP[timezone]);
      return TIMEZONE_CURRENCY_MAP[timezone];
    }
  } catch (e) {
    console.log('[Currency] Timezone detection failed:', e);
  }

  // 2. Intentar detección por navigator.language (locale completo)
  try {
    const locale = navigator.language;
    if (locale && LOCALE_CURRENCY_MAP[locale]) {
      console.log('[Currency] Detected from locale:', locale, '->', LOCALE_CURRENCY_MAP[locale]);
      return LOCALE_CURRENCY_MAP[locale];
    }

    // 3. Intentar con el idioma base (ej: "es" de "es-CO")
    const baseLang = locale?.split('-')[0];
    if (baseLang === 'es') {
      console.log('[Currency] Spanish locale detected, defaulting to COP');
      return 'COP';
    }
    if (baseLang === 'pt') {
      console.log('[Currency] Portuguese locale detected, defaulting to BRL');
      return 'BRL';
    }
    if (baseLang === 'en') {
      console.log('[Currency] English locale detected, defaulting to USD');
      return 'USD';
    }
  } catch (e) {
    console.log('[Currency] Locale detection failed:', e);
  }

  // 4. Fallback al default
  console.log('[Currency] Using default currency:', DEFAULT_CURRENCY);
  return DEFAULT_CURRENCY;
}

/**
 * Obtiene la información de la moneda recomendada basada en detección
 */
export function getRecommendedCurrency(): CurrencyInfo {
  const detectedCode = detectCurrency();
  return getCurrencyByCode(detectedCode) || getCurrencyByCode(DEFAULT_CURRENCY)!;
}
