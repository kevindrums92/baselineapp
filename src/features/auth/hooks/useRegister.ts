/**
 * useRegister Hook
 * Registration flow
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthSessionData } from '../types/auth.types';
import {
  signUpWithEmail,
  signUpWithPhone,
} from '../services/auth.service';
import { detectIdentifierType, normalizeEmail, validatePhone } from '../services/validation.service';

interface UseRegisterReturn {
  register: (identifier: string, password: string, name: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRegister(): UseRegisterReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (
    identifier: string,
    password: string,
    name: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const identifierType = detectIdentifierType(identifier);

      // Attempt sign up
      const result = identifierType === 'email'
        ? await signUpWithEmail(identifier, password, name)
        : await signUpWithPhone(identifier, password, name);

      if (!result.success) {
        setError(result.error || 'Error al registrarse');
        return;
      }

      // New users always need OTP verification
      console.log('[useRegister] Registration successful, redirecting to OTP');

      // ⚠️ CRITICAL: Mark session as pending OTP verification
      localStorage.setItem('auth.pendingOtpVerification', Date.now().toString());

      const sessionData: AuthSessionData = {
        identifier: identifierType === 'email'
          ? normalizeEmail(identifier)
          : validatePhone(identifier).normalized,
        identifierType,
        isNewUser: true,
        userId: result.userId,
        otpPurpose: 'signup', // Confirming email after registration
      };

      navigate('/onboarding/auth/verify', {
        replace: true,
        state: sessionData,
      });
    } catch (err) {
      console.error('[useRegister] Register error:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    register,
    isLoading,
    error,
    clearError,
  };
}
