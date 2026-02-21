/**
 * CurrencyProvider
 * Provider para manejar la moneda seleccionada y formateo de cantidades
 */

import React, { useState, useCallback, useMemo } from 'react';
import { CurrencyContext, type CurrencyContextValue } from '../context/CurrencyContext';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  STORAGE_KEY,
  getCurrencyByCode,
} from '../utils/currency.constants';
import { detectCurrency } from '../utils/currency.detection';

function getInitialCurrency(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;

  // 1. Intentar cargar de localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CURRENCIES.find((c) => c.code === stored)) {
    console.log('[Currency] Loaded from storage:', stored);
    return stored;
  }

  // 2. Auto-detectar y guardar
  const detected = detectCurrency();
  localStorage.setItem(STORAGE_KEY, detected);
  return detected;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(getInitialCurrency);

  const currencyInfo = useMemo(() => {
    return getCurrencyByCode(currency) || getCurrencyByCode(DEFAULT_CURRENCY)!;
  }, [currency]);

  const setCurrency = useCallback((code: string) => {
    if (!CURRENCIES.find((c) => c.code === code)) {
      console.error('[Currency] Invalid currency code:', code);
      return;
    }
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
    console.log('[Currency] Currency changed to:', code);
  }, []);

  const formatAmount = useCallback(
    (value: number): string => {
      try {
        return new Intl.NumberFormat(currencyInfo.locale, {
          style: 'currency',
          currency: currencyInfo.code,
          maximumFractionDigits: currencyInfo.decimals,
          minimumFractionDigits: currencyInfo.decimals,
        }).format(value);
      } catch {
        // Fallback si hay error con el locale
        return `${currencyInfo.symbol} ${value.toLocaleString()}`;
      }
    },
    [currencyInfo]
  );

  const value: CurrencyContextValue = useMemo(
    () => ({
      currency,
      currencyInfo,
      setCurrency,
      formatAmount,
    }),
    [currency, currencyInfo, setCurrency, formatAmount]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
