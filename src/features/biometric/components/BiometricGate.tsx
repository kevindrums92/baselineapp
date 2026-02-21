/**
 * BiometricGate Component
 *
 * Lifecycle coordinator for native biometric authentication.
 * Triggers OS-native biometric prompt (Face ID/Touch ID/Fingerprint) based on:
 * - Cold start (app launch)
 * - App resume after 5 minutes inactive
 * - Biometric enabled in settings (persisted in localStorage, works offline)
 *
 * Renders lock screen overlay when authentication is required.
 * Only unlocks when biometric authentication succeeds.
 */

import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/state/app.store';
import { checkBiometricAvailability, authenticateWithBiometrics } from '../services/biometric.service';
import { Fingerprint } from 'lucide-react';

const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function BiometricGate() {
  const { t } = useTranslation('profile');
  const lastAuthRef = useRef<number>(Date.now());
  const isAuthenticatingRef = useRef<boolean>(false);
  const [isLocked, setIsLocked] = useState(false);

  // Get security state (persisted in localStorage, available immediately on cold start)
  const security = useAppStore((s) => s.security);
  const updateLastAuthTimestamp = useAppStore((s) => s.updateLastAuthTimestamp);

  const biometricEnabled = security?.biometricEnabled ?? false;

  // Trigger native biometric authentication directly
  const triggerBiometricAuth = async (): Promise<void> => {
    // Prevent multiple simultaneous authentications
    if (isAuthenticatingRef.current) {
      console.log('[BiometricGate] Already authenticating, skipping');
      return;
    }

    // Only on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[BiometricGate] Not native platform, skipping');
      setIsLocked(false);
      return;
    }

    // Only if biometric is enabled in settings
    if (!biometricEnabled) {
      console.log('[BiometricGate] Biometric not enabled, skipping');
      setIsLocked(false);
      return;
    }

    // Check if enough time has passed since last auth
    const now = Date.now();
    const lastAuth = security?.lastAuthTimestamp ?? 0;
    const timeSinceLastAuth = now - lastAuth;

    if (timeSinceLastAuth < BIOMETRIC_TIMEOUT) {
      console.log('[BiometricGate] Last auth was recent, skipping');
      setIsLocked(false);
      return;
    }

    // Check if biometric is available
    try {
      console.log('[BiometricGate] Checking biometric availability...');
      const availability = await checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.log('[BiometricGate] Biometric not available, skipping');
        setIsLocked(false);
        return;
      }

      console.log('[BiometricGate] Triggering native biometric prompt, type:', availability.biometryType);

      // Show lock screen before authentication
      setIsLocked(true);

      // Set authenticating flag
      isAuthenticatingRef.current = true;

      // Call native biometric authentication directly
      const result = await authenticateWithBiometrics(t('biometricLock.unlockReason'));

      if (result.success) {
        console.log('[BiometricGate] Authentication successful');
        updateLastAuthTimestamp();
        lastAuthRef.current = Date.now();
        // Unlock the app
        setIsLocked(false);
      } else {
        console.log('[BiometricGate] Authentication failed:', result.errorCode);
        // Keep lock screen visible - user must retry or authenticate successfully
      }
    } catch (error) {
      console.error('[BiometricGate] Error during authentication:', error);
      // Keep lock screen visible on error
    } finally {
      isAuthenticatingRef.current = false;
    }
  };

  // Cold start: Check on mount and trigger native auth
  useEffect(() => {
    let isMounted = true;

    const checkOnMount = async () => {
      // Small delay to let the app fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!isMounted) return;

      // Trigger native biometric authentication directly
      await triggerBiometricAuth();
    };

    checkOnMount();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]); // Re-run when biometric setting changes

  // App resume: Check when app comes to foreground and trigger native auth
  useEffect(() => {
    let isMounted = true;

    const listener = CapacitorApp.addListener('appStateChange', async (state) => {
      if (!isMounted) return;

      if (state.isActive) {
        console.log('[BiometricGate] App resumed');

        // Check if enough time passed since last check
        const now = Date.now();
        const timeSinceLastCheck = now - lastAuthRef.current;

        if (timeSinceLastCheck < BIOMETRIC_TIMEOUT) {
          console.log('[BiometricGate] App was inactive for less than timeout, skipping');
          return;
        }

        // Update last check time
        lastAuthRef.current = now;

        // Trigger native biometric authentication directly
        await triggerBiometricAuth();
      }
    });

    return () => {
      isMounted = false;
      listener.then((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]); // Re-subscribe when biometric setting changes

  // Render lock screen when authentication is required
  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950">
      {/* Lock screen content */}
      <div className="flex flex-col items-center px-6">
        {/* Lock icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <Fingerprint className="h-12 w-12 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          {t('biometricLock.title')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 text-center text-sm text-gray-400">
          {t('biometricLock.subtitle')}
        </p>

        {/* Retry button */}
        <button
          type="button"
          onClick={triggerBiometricAuth}
          className="rounded-2xl bg-[#18B7B0] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#16a59f] active:scale-[0.98]"
        >
          {t('biometricLock.unlockButton')}
        </button>
      </div>
    </div>
  );
}
