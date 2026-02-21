/**
 * Currency Context
 * Define el contexto para el sistema de moneda
 */

import { createContext } from 'react';
import type { CurrencyInfo } from '../utils/currency.constants';

export interface CurrencyContextValue {
  /** Código de moneda actual (ej: "COP", "USD") */
  currency: string;
  /** Información completa de la moneda actual */
  currencyInfo: CurrencyInfo;
  /** Cambia la moneda actual */
  setCurrency: (code: string) => void;
  /** Formatea un monto con la moneda actual (incluye símbolo) */
  formatAmount: (value: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);
