/**
 * Currency Feature
 * Sistema de selección y formateo de monedas
 */

// Components
export { CurrencyProvider } from './components/CurrencyProvider';

// Hooks
export { useCurrency } from './hooks/useCurrency';

// Utils
export {
  CURRENCIES,
  CURRENCY_REGIONS,
  STORAGE_KEY,
  DEFAULT_CURRENCY,
  getCurrencyByCode,
  getCurrenciesByRegion,
  searchCurrencies,
  type CurrencyInfo,
  type CurrencyRegion,
} from './utils/currency.constants';

export {
  detectCurrency,
  getRecommendedCurrency,
} from './utils/currency.detection';
