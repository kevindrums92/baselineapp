/**
 * usePrivacy Hook
 * Hook to access privacy mode context
 */

import { useContext } from 'react';
import { PrivacyContext } from '../context/PrivacyContext';

export function usePrivacy() {
  const context = useContext(PrivacyContext);

  if (context === undefined) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }

  return context;
}
