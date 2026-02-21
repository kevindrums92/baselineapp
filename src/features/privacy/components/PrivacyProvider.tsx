/**
 * PrivacyProvider
 * Provider for privacy mode (censoring sensitive financial data)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PrivacyContext, type PrivacyContextValue } from '../context/PrivacyContext';

const STORAGE_KEY = 'app_privacy_mode';

function getInitialPrivacyMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === '1'; // Use "1" like other boolean flags in the app
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState<boolean>(getInitialPrivacyMode);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem(STORAGE_KEY, '1');
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('[Privacy] Failed to persist privacy mode:', err);
      }
      console.log('[Privacy] Privacy mode toggled:', next);
      return next;
    });
  }, []);

  const formatWithPrivacy = useCallback(
    (formattedAmount: string, currencySymbol: string): string => {
      if (!privacyMode) return formattedAmount;

      // Return censored format: "$ -----"
      return `${currencySymbol} -----`;
    },
    [privacyMode]
  );

  const value: PrivacyContextValue = useMemo(
    () => ({
      privacyMode,
      togglePrivacyMode,
      formatWithPrivacy,
    }),
    [privacyMode, togglePrivacyMode, formatWithPrivacy]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}
