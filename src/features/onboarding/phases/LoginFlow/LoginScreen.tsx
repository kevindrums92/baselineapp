/**
 * LoginScreen
 * Pantalla de autenticación (para logout/re-login, no parte del onboarding inicial)
 * Contextos:
 * 1. Logout: Login → App (directo)
 * 2. Device initialized but no session: Login → Config or App
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Chrome, Apple, Loader2, User, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useOnboarding } from '../../OnboardingContext';
import { ONBOARDING_KEYS } from '../../utils/onboarding.constants';
import { markOnboardingComplete } from '../../utils/onboarding.helpers';
import { openLegalPage } from '@/shared/utils/browser.utils';
import { signInWithOAuthInAppBrowser } from '@/shared/utils/oauth.utils';
import { isNative } from '@/shared/utils/platform';

export default function LoginScreen() {
  const { t, i18n } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { state, updatePhase, setAuthMethod } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<{ message: string; isRetryable: boolean } | null>(null);

  // Post-logout: user logged out explicitly and needs a way to continue as guest
  const isPostLogout = localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true';

  // Track OAuth in progress to handle browser cancellation
  const oauthInProgress = useRef(false);
  // Track last OAuth provider used (for identity_already_exists retry)
  const lastProvider = useRef<'google' | 'apple'>('google');

  // ✅ CRITICAL: Mark device as initialized when user reaches login screen
  // This permanent flag ensures WelcomeOnboarding is only shown on first device use
  useEffect(() => {
    const isAlreadyInitialized = localStorage.getItem(ONBOARDING_KEYS.DEVICE_INITIALIZED) === 'true';
    if (!isAlreadyInitialized) {
      localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
      console.log('[LoginScreen] Device marked as initialized (first time reaching login)');
    }
  }, []);

  // Sync context with URL when component mounts
  useEffect(() => {
    if (state.phase !== 'login') {
      console.log('[LoginScreen] Syncing context phase to login');
      updatePhase('login');
    }
  }, [state.phase, updatePhase]);

  /**
   * Listener para errores de OAuth callback
   */
  useEffect(() => {
    const handleOAuthError = (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string; code: number; isRetryable: boolean }>;
      const { error, isRetryable } = customEvent.detail;

      console.log('[LoginScreen] OAuth error received:', { error, isRetryable });

      // Stop loading state and OAuth tracking
      setLoading(false);
      oauthInProgress.current = false;

      // Show error modal
      setOAuthError({
        message: error,
        isRetryable,
      });
    };

    window.addEventListener('oauth-error', handleOAuthError);

    return () => {
      window.removeEventListener('oauth-error', handleOAuthError);
    };
  }, []);

  /**
   * Listener para identity_already_exists error.
   * When linkIdentity() fails because the OAuth identity is already linked to
   * another user, retry with regular signInWithOAuth (signs in as existing user).
   */
  useEffect(() => {
    const handleIdentityExists = async () => {
      console.log('[LoginScreen] Identity already exists, retrying with signInWithOAuth');
      oauthInProgress.current = true;

      try {
        // Retry with regular signInWithOAuth (signs in as the existing user).
        // User will need to authenticate again since each OAuth flow is a new authorization request.
        const { error: authError } = await signInWithOAuthInAppBrowser(lastProvider.current, {
          queryParams: lastProvider.current === 'google' ? { prompt: 'select_account' } : undefined,
          skipLinkIdentity: true,
        });

        if (authError) throw authError;
        console.log('[LoginScreen] OAuth retry initiated (signInWithOAuth)');
      } catch (err: any) {
        console.error('[LoginScreen] Error in OAuth retry:', err);
        setError(err.message || 'Error al iniciar sesión');
        setLoading(false);
        oauthInProgress.current = false;
      }
    };

    window.addEventListener('oauth-identity-exists', handleIdentityExists);

    return () => {
      window.removeEventListener('oauth-identity-exists', handleIdentityExists);
    };
  }, []);

  /**
   * Listener para detectar cuando el usuario vuelve a la app sin completar OAuth
   * (cerró el in-app browser sin hacer login)
   */
  useEffect(() => {
    if (!isNative()) return;

    let appListener: any;

    const setupListener = async () => {
      const { App } = await import('@capacitor/app');

      appListener = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && oauthInProgress.current) {
          console.log('[LoginScreen] App returned to foreground during OAuth');

          // Wait a bit for session to be established
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if session was created
          const { data } = await supabase.auth.getSession();

          if (!data.session || data.session.user.is_anonymous) {
            // No real session = user cancelled OAuth (anonymous session doesn't count)
            // NOTE: Don't remove oauthTransition flag here — deep link may arrive AFTER
            // this check (race condition). Flag is cleaned by CloudSyncGate SIGNED_IN handler
            // or by the 2-minute stale check.
            console.log('[LoginScreen] No real session found, user likely cancelled OAuth');
            setLoading(false);
            oauthInProgress.current = false;
          } else {
            // Real session exists = OAuth succeeded, clear OAuth tracking
            console.log('[LoginScreen] Session found, OAuth completed successfully');
            oauthInProgress.current = false;
          }
        }
      });
    };

    setupListener();

    return () => {
      if (appListener) {
        appListener.remove();
      }
    };
  }, []);

  /**
   * Listener para detectar cuando el usuario regresa del OAuth
   * y la sesión se crea exitosamente
   */
  useEffect(() => {
    const checkSession = async () => {
      // Si hay flag de logout, ignorar sesión existente (puede estar cerrándose)
      // El usuario llegó aquí porque hizo logout, no por OAuth callback
      if (localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true') {
        console.log('[LoginScreen] Logout flag detected, ignoring existing session');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session && !data.session.user.is_anonymous) {
        console.log('[LoginScreen] Session detected on mount, handling OAuth callback');
        handleOAuthCallback();
      }
    };

    // Check inicial al montar
    checkSession();

    // Listener para cambios de auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[LoginScreen] Auth event:', event);

        if (event === 'SIGNED_IN' && session && !session.user.is_anonymous) {
          // Defer to next tick: exchangeCodeForSession() emits SIGNED_IN while holding
          // a navigator.locks lock. handleOAuthCallback → getCloudState → getSession()
          // would deadlock trying to acquire the same lock.
          setTimeout(() => handleOAuthCallback(), 0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Maneja el retorno exitoso de OAuth
   */
  const handleOAuthCallback = async () => {
    setAuthMethod('google');

    // Limpiar flag de logout (el usuario se logueó de nuevo)
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

    // ✅ ALWAYS check cloud data first to determine if THIS specific user is new or returning.
    // The localStorage COMPLETED flag is device-scoped (not per-user), so after logout + login
    // with a different account, the flag would still be true from the previous user.
    try {
      console.log('[LoginScreen] Checking cloud data for returning user detection...');
      const { getCloudState } = await import('@/services/cloudState.service');
      const cloudData = await getCloudState();

      if (cloudData) {
        const hasCloudData = cloudData.welcomeSeen === true;

        if (hasCloudData) {
          console.log('[LoginScreen] OAuth success → App (returning user, cloud has data)');
          localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
          localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
          navigate('/', { replace: true });
          return;
        }
      }

      // No cloud data → check if user has LOCAL data (guest user connecting account)
      const { loadState } = await import('@/services/storage.service');
      const localData = loadState();

      if (localData) {
        const hasLocalData = localData.welcomeSeen === true;

        if (hasLocalData) {
          console.log('[LoginScreen] OAuth success → App (guest user connecting account, has local data)');
          localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
          localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
          navigate('/', { replace: true });
          return;
        }
      }

      // No cloud data AND no local data → new user, go to FirstConfig
      console.log('[LoginScreen] OAuth success → First Config (new user, no data)');
      navigate('/onboarding/config/1', { replace: true });
    } catch (err) {
      console.error('[LoginScreen] Error checking cloud data:', err);
      // Fallback: use localStorage flag only if cloud check fails
      const onboardingCompleted = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
      if (onboardingCompleted) {
        console.log('[LoginScreen] OAuth success → App (cloud check failed, using local flag)');
        navigate('/', { replace: true });
      } else {
        console.log('[LoginScreen] OAuth success → First Config (cloud check failed, no local flag)');
        navigate('/onboarding/config/1', { replace: true });
      }
    }
  };

  /**
   * Maneja el login con Google OAuth (uses in-app browser on native)
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    oauthInProgress.current = true;
    lastProvider.current = 'google';

    try {
      // Save anonymous user ID so we can clean up orphaned data after OAuth
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession.session?.user?.is_anonymous) {
        localStorage.setItem('app.previousAnonUserId', currentSession.session.user.id);
      }

      // Flag OAuth transition so CloudSyncGate's SIGNED_OUT handler preserves local data
      // (exchangeCodeForSession emits SIGNED_OUT when replacing the anonymous session)
      localStorage.setItem('app.oauthTransition', Date.now().toString());

      const { error: authError } = await signInWithOAuthInAppBrowser('google', {
        queryParams: {
          prompt: 'select_account',
        },
        // Always use signInWithOAuth on login screens (never linkIdentity).
        // This avoids identity_already_exists which forces a second authentication.
        // linkIdentity is only for "connect account" flows where preserving user_id matters.
        skipLinkIdentity: true,
      });

      if (authError) throw authError;

      console.log('[LoginScreen] Google OAuth initiated');
    } catch (err: any) {
      console.error('[LoginScreen] Error en Google login:', err);
      localStorage.removeItem('app.oauthTransition');
      localStorage.removeItem('app.previousAnonUserId');
      setError(err.message || t('login.errorGoogle'));
      setLoading(false);
      oauthInProgress.current = false;
    }
  };

  /**
   * Maneja el login con Apple OAuth (uses in-app browser on native)
   */
  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    oauthInProgress.current = true;
    lastProvider.current = 'apple';

    try {
      // Save anonymous user ID so we can clean up orphaned data after OAuth
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession.session?.user?.is_anonymous) {
        localStorage.setItem('app.previousAnonUserId', currentSession.session.user.id);
      }

      // Flag OAuth transition so CloudSyncGate's SIGNED_OUT handler preserves local data
      // (exchangeCodeForSession emits SIGNED_OUT when replacing the anonymous session)
      localStorage.setItem('app.oauthTransition', Date.now().toString());

      const { error: authError } = await signInWithOAuthInAppBrowser('apple', {
        // Always use signInWithOAuth on login screens (never linkIdentity).
        // This avoids identity_already_exists which forces a second authentication.
        skipLinkIdentity: true,
      });

      if (authError) throw authError;

      console.log('[LoginScreen] Apple OAuth initiated');
    } catch (err: any) {
      console.error('[LoginScreen] Error en Apple login:', err);
      localStorage.removeItem('app.oauthTransition');
      localStorage.removeItem('app.previousAnonUserId');
      setError(err.message || 'Error al iniciar sesión con Apple');
      setLoading(false);
      oauthInProgress.current = false;
    }
  };

  /**
   * Guest mode: clear logout flag and go to app with anonymous session
   * Only available after explicit logout (not during onboarding or from Settings)
   */
  const handleGuestMode = () => {
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);
    markOnboardingComplete();
    console.log('[LoginScreen] Guest mode selected → App (post-logout, anonymous session)');
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header with safe-area + conditional back button */}
      <header
        className="sticky top-0 z-10 flex shrink-0 items-center bg-white dark:bg-gray-900 px-4 py-4 shadow-sm"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        {!isPostLogout ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Volver"
          >
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t('login.cta', 'Iniciar sesión')}
        </h1>
        <div className="h-10 w-10" />
      </header>

      {/* Header con icono de seguridad */}
      <div className="flex flex-col items-center px-6 pt-4 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Shield size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('login.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('login.subtitle')}
        </p>
      </div>

      {/* Features de privacidad - Texto informativo */}
      <div className="mx-6 mb-8">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('login.privacyNote')}
          </p>
        </div>
      </div>

      {/* Opciones de autenticación */}
      <div className="flex-1 px-6 pb-8">
        <div className="space-y-3">
          {/* Divider label */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 dark:bg-gray-950 px-2 text-gray-600 dark:text-gray-400">{t('login.divider')}</span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Chrome className="h-5 w-5 text-gray-700 dark:text-gray-300 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('login.continueWith')} {t('login.google')}</span>
            {loading && lastProvider.current === 'google' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </button>

          {/* Apple Sign In */}
          <button
            type="button"
            onClick={handleAppleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 dark:bg-gray-50 p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Apple className="h-5 w-5 text-white dark:text-gray-900 shrink-0" />
            <span className="text-sm font-semibold text-white dark:text-gray-900">{t('login.continueWith')} {t('login.apple')}</span>
            {loading && lastProvider.current === 'apple' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </button>

          {/* Guest mode - only after explicit logout */}
          {isPostLogout && (
            <button
              type="button"
              onClick={handleGuestMode}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors active:bg-gray-100 dark:active:bg-gray-800 disabled:opacity-50"
            >
              <User className="h-4 w-4" />
              <span>{t('login.guestContinue')}</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Privacy Notice */}
        <p className="mt-6 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t('login.termsPrefix')}{' '}
          <button
            type="button"
            onClick={() => {
              const locale = i18n.language || 'es';
              openLegalPage('terms', locale);
            }}
            className="font-medium text-[#18B7B0] underline"
          >
            {t('login.termsService')}
          </button>{' '}
          {t('login.termsAnd')}{' '}
          <button
            type="button"
            onClick={() => {
              const locale = i18n.language || 'es';
              openLegalPage('privacy', locale);
            }}
            className="font-medium text-[#18B7B0] underline"
          >
            {t('login.termsPrivacy')}
          </button>
        </p>
      </div>

      {/* OAuth Error Modal */}
      {oauthError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOAuthError(null)}
          />

          {/* Modal Card */}
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Error de conexión
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {oauthError.message}
            </p>

            {/* Actions */}
            <div className={oauthError.isRetryable ? "flex gap-3" : ""}>
              <button
                type="button"
                onClick={() => setOAuthError(null)}
                className={`${
                  oauthError.isRetryable
                    ? "flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
                }`}
              >
                Cerrar
              </button>

              {oauthError.isRetryable && (
                <button
                  type="button"
                  onClick={() => {
                    setOAuthError(null);
                    handleGoogleLogin();
                  }}
                  className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#13948e]"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
