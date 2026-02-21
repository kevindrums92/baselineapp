/**
 * Privacy Context
 * Context for privacy mode (censoring sensitive financial data)
 */

import { createContext } from 'react';

export interface PrivacyContextValue {
  /** Whether privacy mode is enabled (numbers censored) */
  privacyMode: boolean;

  /** Toggle privacy mode on/off */
  togglePrivacyMode: () => void;

  /** Format amount with privacy censoring */
  formatWithPrivacy: (formattedAmount: string, currencySymbol: string) => string;
}

export const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);
