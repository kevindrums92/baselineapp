/**
 * useCurrency Hook
 * Hook para acceder al contexto de moneda
 */

import { useContext } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }

  return context;
}
