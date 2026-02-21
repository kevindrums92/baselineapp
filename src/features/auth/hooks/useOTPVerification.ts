/**
 * useOTPVerification Hook
 * OTP input state and verification
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OTPType } from '../types/auth.types';
import { verifyOTP, resendOTP, send2FAOTP } from '../services/auth.service';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

interface UseOTPVerificationReturn {
  // Digits state
  digits: string[];
  setDigit: (index: number, value: string) => void;
  clearDigits: () => void;

  // Verification state
  isVerifying: boolean;
  error: string | null;
  clearError: () => void;

  // Resend state
  resendCooldown: number;
  canResend: boolean;

  // Computed
  isComplete: boolean;
  otpCode: string;

  // Actions
  verify: (identifier: string, type: OTPType, purpose?: 'signup' | '2fa') => Promise<boolean>;
  resend: (identifier: string, type: OTPType, purpose?: 'signup' | '2fa') => Promise<boolean>;
}

export function useOTPVerification(): UseOTPVerificationReturn {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cooldown timer
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start cooldown timer on mount (user just received OTP)
  useEffect(() => {
    startCooldown();

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set a single digit
  const setDigit = useCallback((index: number, value: string) => {
    // Only accept single digit
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  // Clear all digits
  const clearDigits = useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(''));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if all digits are filled
  const isComplete = digits.every((d) => d.length === 1);

  // Get full OTP code
  const otpCode = digits.join('');

  // Can resend when cooldown is 0
  const canResend = resendCooldown === 0;

  // Verify OTP
  const verify = useCallback(async (
    identifier: string,
    type: OTPType,
    purpose: 'signup' | '2fa' = 'signup'
  ): Promise<boolean> => {
    if (!isComplete) return false;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyOTP(identifier, otpCode, type, purpose);

      if (!result.success) {
        setError(result.error || 'Código incorrecto');
        clearDigits();
        return false;
      }

      return true;
    } catch (err) {
      console.error('[useOTPVerification] Verify error:', err);
      setError('Error al verificar el código');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isComplete, otpCode, clearDigits]);

  // Resend OTP
  const resend = useCallback(async (
    identifier: string,
    type: OTPType,
    purpose: 'signup' | '2fa' = 'signup'
  ): Promise<boolean> => {
    if (!canResend) return false;

    try {
      let result;

      // For 2FA login, use send2FAOTP
      // For signup, use resendOTP
      if (purpose === '2fa') {
        // Map OTPType to send2FAOTP type ('email' | 'phone')
        const send2FAType = type === 'email' ? 'email' : 'phone';
        result = await send2FAOTP(identifier, send2FAType);
      } else {
        result = await resendOTP(identifier, type);
      }

      if (!result.success) {
        setError(result.error || 'No se pudo reenviar el código');
        return false;
      }

      // Clear digits and restart cooldown
      clearDigits();
      setError(null);
      startCooldown();

      return true;
    } catch (err) {
      console.error('[useOTPVerification] Resend error:', err);
      setError('Error al reenviar el código');
      return false;
    }
  }, [canResend, clearDigits, startCooldown]);

  return {
    digits,
    setDigit,
    clearDigits,
    isVerifying,
    error,
    clearError,
    resendCooldown,
    canResend,
    isComplete,
    otpCode,
    verify,
    resend,
  };
}
