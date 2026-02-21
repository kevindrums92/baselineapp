/**
 * ResetPasswordOTPPage
 * Verificación de OTP para recuperación de contraseña
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2 } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import { verifyPasswordResetOTP, sendPasswordResetEmail } from '../services/auth.service';
import { maskEmail } from '../services/validation.service';

export default function ResetPasswordOTPPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state
  const email = (location.state as { email?: string })?.email;

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      console.warn('[ResetPasswordOTPPage] No email provided, redirecting to auth');
      navigate('/onboarding/auth', { replace: true });
    }
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    setDigits((prevDigits) => {
      const newDigits = [...prevDigits];
      newDigits[index] = value;

      // Auto-verify when all digits are filled
      if (newDigits.every((d) => d !== '') && newDigits.join('').length === 6) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => handleVerify(newDigits), 0);
      }

      return newDigits;
    });
    setError(null);
  };

  const handleVerify = async (digitsToVerify: string[] = digits) => {
    const code = digitsToVerify.join('');
    if (code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    console.log('[ResetPasswordOTPPage] Verifying OTP for password reset');
    const result = await verifyPasswordResetOTP(email!, code);

    setIsVerifying(false);

    if (result.success) {
      console.log('[ResetPasswordOTPPage] OTP verified, navigating to reset password');
      // Navigate to password reset page
      navigate('/onboarding/reset-password', { replace: true });
    } else {
      console.error('[ResetPasswordOTPPage] OTP verification failed:', result.error);
      setError(result.error || t('auth.errors.otpInvalid', 'Código incorrecto'));
      setDigits(['', '', '', '', '', '']);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    console.log('[ResetPasswordOTPPage] Resending password reset OTP to:', email);
    const result = await sendPasswordResetEmail(email);

    if (result.success) {
      console.log('[ResetPasswordOTPPage] OTP resent successfully');
      setResendCooldown(30);
      setError(null);
    } else {
      console.error('[ResetPasswordOTPPage] Failed to resend OTP:', result.error);
      setError(result.error || 'Error al reenviar el código');
    }
  };

  if (!email) return null;

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full w-1/3 bg-[#18B7B0] transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-6 pt-12 pb-32">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <KeyRound className="h-10 w-10 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.verify.title', 'Verificación')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.verify.message', 'Ingresamos un código de 6 dígitos a')}{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {maskEmail(email)}
          </span>
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <OTPInput
            digits={digits}
            onDigitChange={handleDigitChange}
            error={!!error}
            disabled={isVerifying}
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Resend link */}
        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.verify.resendIn', { seconds: resendCooldown })}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-[#18B7B0] hover:underline"
            >
              {t('auth.verify.resend', 'Reenviar código')}
            </button>
          )}
        </div>
      </div>

      {/* Verify button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-950 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={digits.join('').length !== 6 || isVerifying}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t('auth.verify.button', 'Verificar')
          )}
        </button>
      </div>
    </div>
  );
}
