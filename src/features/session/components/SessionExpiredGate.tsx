/**
 * SessionExpiredGate
 *
 * Fullscreen blocking modal shown when an authenticated user's session expires
 * unexpectedly (e.g., refresh token rotation failure due to network issues).
 *
 * The user MUST either re-authenticate or explicitly choose to continue as guest.
 * There is no way to dismiss this modal otherwise — this prevents users from
 * unknowingly adding data that won't sync to their account.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Chrome, Apple, Loader2, User } from 'lucide-react';
import { useAppStore } from '@/state/app.store';
import { signInWithOAuthInAppBrowser } from '@/shared/utils/oauth.utils';
import { supabase } from '@/lib/supabaseClient';

export default function SessionExpiredGate() {
  const { t } = useTranslation('session');
  const sessionExpired = useAppStore((s) => s.sessionExpired);
  const setSessionExpired = useAppStore((s) => s.setSessionExpired);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProvider = useRef<'google' | 'apple' | null>(null);

  // Read persisted auth info from localStorage
  const lastEmail = localStorage.getItem('app.lastAuthEmail');
  const lastAuthProvider = localStorage.getItem('app.lastAuthProvider');

  // Listen for OAuth errors from deep link handler (main.tsx)
  useEffect(() => {
    if (!sessionExpired) return;

    const handleOAuthError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setError(detail?.error || t('expired.error'));
      setLoading(false);
    };

    window.addEventListener('oauth-error', handleOAuthError);
    return () => window.removeEventListener('oauth-error', handleOAuthError);
  }, [sessionExpired, t]);

  // Lock body scroll when visible
  useEffect(() => {
    if (sessionExpired) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sessionExpired]);

  if (!sessionExpired) return null;

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);
    lastProvider.current = provider;

    try {
      // Set OAuth transition flag to protect against SIGNED_OUT during the transition
      localStorage.setItem('app.oauthTransition', Date.now().toString());

      const { error: authError } = await signInWithOAuthInAppBrowser(provider, {
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        skipLinkIdentity: true, // Fresh sign-in, not linking
      });

      if (authError) throw authError;

      console.log(`[SessionExpiredGate] ${provider} OAuth initiated`);
      // Success: CloudSyncGate's SIGNED_IN handler will clear flags and set sessionExpired = false
    } catch (err: any) {
      console.error(`[SessionExpiredGate] ${provider} OAuth error:`, err);
      localStorage.removeItem('app.oauthTransition');
      setError(err.message || t('expired.error'));
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setLoading(true);
    setError(null);

    // Clear all auth persistence flags
    localStorage.removeItem('app.wasAuthenticated');
    localStorage.removeItem('app.lastAuthEmail');
    localStorage.removeItem('app.lastAuthProvider');

    // Dismiss modal
    setSessionExpired(false);

    // Create anonymous session for cloud sync
    try {
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.warn('[SessionExpiredGate] Failed to create anonymous session:', anonError);
      } else {
        console.log('[SessionExpiredGate] Anonymous session created, SIGNED_IN will init cloud sync');
      }
    } catch (err) {
      console.warn('[SessionExpiredGate] signInAnonymously error:', err);
    }

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center px-6">
        {/* Icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <ShieldAlert className="h-12 w-12 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center text-2xl font-bold text-white">
          {t('expired.title')}
        </h1>

        {/* Subtitle */}
        <p className="mb-2 text-center text-sm leading-relaxed text-gray-400">
          {t('expired.subtitle')}
        </p>

        {/* Email hint */}
        {lastEmail && (
          <p className="mb-8 text-center text-xs text-gray-500">
            {t('expired.emailHint', { email: lastEmail })}
          </p>
        )}
        {!lastEmail && <div className="mb-8" />}

        {/* OAuth buttons */}
        <div className="w-full space-y-3">
          {/* Google OAuth - show first if last provider was google or unknown */}
          {(lastAuthProvider !== 'apple') && (
            <>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-700 bg-white p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Chrome className="h-5 w-5 shrink-0 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('expired.googleButton')}
                </span>
                {loading && lastProvider.current === 'google' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-50 p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Apple className="h-5 w-5 shrink-0 text-gray-900" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('expired.appleButton')}
                </span>
                {loading && lastProvider.current === 'apple' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </button>
            </>
          )}

          {/* Apple first if last provider was apple */}
          {lastAuthProvider === 'apple' && (
            <>
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-50 p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Apple className="h-5 w-5 shrink-0 text-gray-900" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('expired.appleButton')}
                </span>
                {loading && lastProvider.current === 'apple' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-700 bg-white p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Chrome className="h-5 w-5 shrink-0 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('expired.googleButton')}
                </span>
                {loading && lastProvider.current === 'google' && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 w-full rounded-xl bg-red-900/20 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Guest mode divider + button */}
        <div className="mt-6 w-full">
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueAsGuest}
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-gray-500 transition-colors active:bg-gray-800 disabled:opacity-50"
          >
            <User className="h-4 w-4" />
            <span>{t('expired.guestButton')}</span>
          </button>

          <p className="mt-2 text-center text-xs leading-relaxed text-gray-600">
            {t('expired.guestWarning')}
          </p>
        </div>
      </div>
    </div>
  );
}
