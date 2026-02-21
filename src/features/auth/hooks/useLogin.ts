/**
 * useLogin Hook
 * Login flow with device trust check
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthSessionData } from '../types/auth.types';
import {
  signInWithEmail,
  signInWithPhone,
  send2FAOTP,
} from '../services/auth.service';
import {
  getDeviceFingerprint,
  checkDeviceTrusted,
} from '../services/device.service';
import { detectIdentifierType, normalizeEmail, validatePhone } from '../services/validation.service';

interface UseLoginReturn {
  login: (identifier: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const identifierType = detectIdentifierType(identifier);

      // Attempt sign in
      const result = identifierType === 'email'
        ? await signInWithEmail(identifier, password)
        : await signInWithPhone(identifier, password);

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
        return;
      }

      // Get device fingerprint and check if trusted
      const fingerprint = await getDeviceFingerprint();
      const isTrusted = result.userId
        ? await checkDeviceTrusted(result.userId, fingerprint)
        : false;

      if (isTrusted) {
        // Device is trusted, skip OTP and go directly to app
        console.log('[useLogin] Trusted device, skipping OTP');
        // Clear pending OTP flag if it exists
        localStorage.removeItem('auth.pendingOtpVerification');
        // Clear logout flag - user just successfully authenticated
        const { ONBOARDING_KEYS } = await import('@/features/onboarding/utils/onboarding.constants');
        localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);
        navigate('/', { replace: true });
      } else {
        // Device not trusted, need OTP verification
        console.log('[useLogin] Untrusted device, sending 2FA OTP');

        // Send 2FA OTP code
        // Map identifierType to send2FAOTP type
        const send2FAType = identifierType === 'email' ? 'email' : 'phone';
        const otpResult = await send2FAOTP(identifier, send2FAType);

        if (!otpResult.success) {
          setError(otpResult.error || 'Error al enviar el código de verificación');
          return;
        }

        // ⚠️ CRITICAL: Mark session as pending OTP verification
        // This will be used to detect and cleanup unverified sessions
        localStorage.setItem('auth.pendingOtpVerification', Date.now().toString());

        const sessionData: AuthSessionData = {
          identifier: identifierType === 'email'
            ? normalizeEmail(identifier)
            : validatePhone(identifier).normalized,
          identifierType,
          isNewUser: false,
          userId: result.userId,
        };

        navigate('/onboarding/auth/verify', {
          replace: true,
          state: sessionData,
        });
      }
    } catch (err) {
      console.error('[useLogin] Login error:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}
