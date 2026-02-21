/**
 * OTPVerificationPage
 * OTP verification after login/register
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2 } from 'lucide-react';

import OTPInput from '../components/OTPInput';
import TrustDevicePrompt from '../components/TrustDevicePrompt';
import { useOTPVerification } from '../hooks/useOTPVerification';
import { getDeviceFingerprint, trustDevice } from '../services/device.service';
import { maskEmail, maskPhone } from '../services/validation.service';
import { getCurrentUser, signOut } from '../services/auth.service';
import type { AuthSessionData, OTPType } from '../types/auth.types';

export default function OTPVerificationPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const location = useLocation();

  // Get session data from navigation state
  const sessionData = location.state as AuthSessionData | undefined;

  const otp = useOTPVerification();
  const [showTrustPrompt, setShowTrustPrompt] = useState(false);
  const [isTrusting, setIsTrusting] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);

  // Track if OTP was verified (to prevent logout on successful verification)
  const didVerifyRef = useRef(false);

  // Redirect if no session data
  useEffect(() => {
    if (!sessionData) {
      console.warn('[OTPVerificationPage] No session data, redirecting');
      navigate('/onboarding/auth', { replace: true });
    }
  }, [sessionData, navigate]);

  // ⚠️ CRITICAL SECURITY: Cleanup session on unmount if OTP was not verified
  // This prevents the bug where users can close OTP screen and keep the session active
  useEffect(() => {
    return () => {
      // If component unmounts and user didn't verify OTP and isn't navigating properly, sign them out
      if (!didVerifyRef.current && !isGoingBack) {
        console.warn('[OTPVerificationPage] ⚠️ SECURITY: Unmounting without OTP verification - signing out');
        signOut();
      }
    };
  }, [isGoingBack]);

  if (!sessionData) {
    return null;
  }

  const { identifier, identifierType, isNewUser } = sessionData;
  const otpType: OTPType = identifierType === 'email' ? 'email' : 'sms';

  // Masked identifier for display
  const maskedIdentifier =
    identifierType === 'email' ? maskEmail(identifier) : maskPhone(identifier);

  // Handle verify
  const handleVerify = async () => {
    // Determine OTP purpose: signup for new users, 2fa for existing users
    const purpose = isNewUser ? 'signup' : '2fa';
    const success = await otp.verify(identifier, otpType, purpose);

    if (success) {
      // ✅ Mark as verified to prevent logout on unmount
      didVerifyRef.current = true;
      // ✅ Clear pending OTP verification flag
      localStorage.removeItem('auth.pendingOtpVerification');
      // Show trust device prompt
      setShowTrustPrompt(true);
    }
  };

  // Handle trust device
  const handleTrustDevice = async () => {
    setIsTrusting(true);

    try {
      const fingerprint = await getDeviceFingerprint();
      const user = await getCurrentUser();

      if (user) {
        await trustDevice(user.id, fingerprint);
      }
    } catch (err) {
      console.error('[OTPVerificationPage] Trust device error:', err);
    }

    await completeAuth();
  };

  // Handle skip trust
  const handleSkipTrust = async () => {
    await completeAuth();
  };

  // Handle back button - sign out and return to auth page
  const handleGoBack = async () => {
    setIsGoingBack(true);
    console.log('[OTPVerificationPage] User cancelled OTP verification - signing out');
    // Clear pending OTP flag
    localStorage.removeItem('auth.pendingOtpVerification');
    await signOut();
    navigate('/onboarding/auth', { replace: true });
  };

  // Complete authentication and navigate to app
  const completeAuth = async () => {
    setIsTrusting(false);
    setShowTrustPrompt(false);

    // ✅ Clear logout flag - user just successfully authenticated
    const { ONBOARDING_KEYS } = await import('@/features/onboarding/utils/onboarding.constants');
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

    // ✅ CRITICAL: Check cloud data to detect returning users who cleared localStorage
    // Even if isNewUser=false, the user might have cloud data from previous installs
    if (!isNewUser) {
      console.log('[OTPVerificationPage] Existing user, checking cloud data...');

      try {
        const { getCloudState } = await import('@/services/cloudState.service');
        const cloudData = await getCloudState();

        if (cloudData) {
          const hasCloudData = cloudData.welcomeSeen === true;

          if (hasCloudData) {
            console.log('[OTPVerificationPage] → App (cloud has data, returning user)');
            // Mark onboarding as complete to avoid checking again
            localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
            localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
            navigate('/', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('[OTPVerificationPage] Error checking cloud data:', err);
        // Continue with normal flow if cloud check fails
      }
    }

    // Navigate to first config if new user or no cloud data, otherwise to app
    if (isNewUser) {
      console.log('[OTPVerificationPage] → First Config (new user)');
      navigate('/onboarding/config/1', { replace: true });
    } else {
      console.log('[OTPVerificationPage] → App (returning user, no cloud data check passed)');
      navigate('/', { replace: true });
    }
  };

  // Handle resend
  const handleResend = async () => {
    // Determine OTP purpose: signup for new users, 2fa for existing users
    const purpose = isNewUser ? 'signup' : '2fa';
    await otp.resend(identifier, otpType, purpose);
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Progress bar at top */}
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
          {t('auth.verify.title', 'Verifica tu identidad')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.verify.message', 'Ingresa el código de 6 dígitos que enviamos a')}{' '}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {maskedIdentifier}
          </span>
        </p>

        {/* OTP Input */}
        <div className="mb-6">
          <OTPInput
            digits={otp.digits}
            onDigitChange={otp.setDigit}
            disabled={otp.isVerifying}
            error={!!otp.error}
          />
        </div>

        {/* Error message */}
        {otp.error && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {otp.error}
          </p>
        )}

        {/* Resend link */}
        <div className="text-center">
          {otp.canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-[#18B7B0] hover:underline"
            >
              {t('auth.verify.resend', 'Reenviar código')}
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.verify.resendIn', { seconds: otp.resendCooldown })}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons - Verify + Back */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-950 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={!otp.isComplete || otp.isVerifying || isGoingBack}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {otp.isVerifying ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t('auth.verify.button', 'Verificar')
          )}
        </button>

        {/* Back button - flat style */}
        <button
          type="button"
          onClick={handleGoBack}
          disabled={otp.isVerifying || isGoingBack}
          className="mt-3 w-full py-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-40"
        >
          {isGoingBack ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            t('auth.verify.back', 'Volver')
          )}
        </button>
      </div>

      {/* Trust Device Prompt */}
      <TrustDevicePrompt
        open={showTrustPrompt}
        onTrust={handleTrustDevice}
        onSkip={handleSkipTrust}
        isLoading={isTrusting}
      />
    </div>
  );
}
