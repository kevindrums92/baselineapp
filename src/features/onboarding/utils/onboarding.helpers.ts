/**
 * Onboarding Helpers
 * Funciones puras sin dependencia del contexto
 * Para usar fuera del OnboardingProvider
 */

import { ONBOARDING_KEYS, LEGACY_WELCOME_KEY } from './onboarding.constants';
import { hasStoredSession } from '@/shared/utils/offlineSession';
import { getNetworkStatus } from '@/services/network.service';

/**
 * Determina qué pantalla mostrar al iniciar la app
 * Versión standalone sin dependencia del contexto
 *
 * OFFLINE-FIRST: This function NEVER blocks on network calls.
 * Session check reads from localStorage directly (not Supabase client).
 * Cloud data check only happens when online with a timeout.
 */
export async function determineStartScreen(): Promise<'app' | 'onboarding' | 'login' | 'continue'> {
  // 1. Check si el onboarding ya se completó alguna vez
  const onboardingEverCompleted =
    localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';

  // 2. Check si hay progreso guardado (usuario en medio del onboarding)
  const savedProgress = getSavedProgress();

  // 3. Check si hay sesión activa — read from localStorage (NEVER from supabase.auth.getSession())
  // supabase.auth.getSession() can hang for 30+ seconds offline if JWT is expired.
  // For routing decisions, reading from localStorage is sufficient and instant.
  let hasActiveSession = hasStoredSession();

  // ⚠️ CRITICAL SECURITY: Check if session is pending OTP verification
  // If session exists but OTP was never verified, invalidate it
  if (hasActiveSession) {
    const pendingOtp = localStorage.getItem('auth.pendingOtpVerification');
    if (pendingOtp) {
      // If pending OTP exists (regardless of age), this session is invalid
      console.warn('[determineStartScreen] ⚠️ SECURITY: Session pending OTP verification detected - invalidating session');
      localStorage.removeItem('auth.pendingOtpVerification');
      // Sign out async (fire-and-forget) — don't await to avoid blocking
      import('@/lib/supabaseClient').then(({ supabase }) => {
        supabase.auth.signOut().catch(() => {});
      });
      hasActiveSession = false;
    }
  }

  // 4. Check si el usuario hizo logout explícito
  const hasLoggedOut = localStorage.getItem(ONBOARDING_KEYS.LOGOUT) === 'true';

  console.log('[determineStartScreen] Estado:', {
    onboardingEverCompleted,
    hasActiveSession,
    hasLoggedOut,
    savedProgress,
    completedKey: localStorage.getItem(ONBOARDING_KEYS.COMPLETED),
    progressKey: localStorage.getItem(ONBOARDING_KEYS.PROGRESS),
    logoutKey: localStorage.getItem(ONBOARDING_KEYS.LOGOUT),
  });

  // CASO 0: Logout explícito → LOGIN (verificar ANTES de sesión activa)
  // El signOut() de Supabase es async, la sesión puede seguir "activa" brevemente
  // Note: Don't require onboardingEverCompleted — markLogout() clears the COMPLETED flag
  // so it would always be false here. The LOGOUT flag alone is sufficient since it's
  // only set by explicit user action (they must have completed onboarding to reach logout).
  if (hasLoggedOut) {
    console.log('[determineStartScreen] → LOGIN (logout explícito, prioridad sobre sesión)');
    return 'login';
  }

  // CASO 1: Usuario con sesión activa → Verificar si completó onboarding
  if (hasActiveSession) {
    // Limpiar flag de logout ya que ahora está logueado
    localStorage.removeItem(ONBOARDING_KEYS.LOGOUT);

    // Si ya completó onboarding, ir a app
    if (onboardingEverCompleted) {
      console.log('[determineStartScreen] → APP (sesión activa y onboarding completado)');
      return 'app';
    }

    // ✅ IMPORTANT: Check cloud data to detect returning users who cleared localStorage
    // If cloud has user data, skip onboarding and go directly to app
    // OFFLINE-SAFE: Only attempt cloud check when online, with a 3s timeout
    const isOnline = await getNetworkStatus();
    if (isOnline) {
      try {
        const cloudCheck = import('@/services/cloudState.service').then(
          ({ getCloudState }) => getCloudState()
        );
        const cloudData = await Promise.race([
          cloudCheck,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (cloudData) {
          const hasCloudData = cloudData.welcomeSeen === true;

          if (hasCloudData) {
            console.log('[determineStartScreen] → APP (cloud has data, returning user)');
            // Mark onboarding as complete to avoid checking again
            localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
            localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
            return 'app';
          }
        }
      } catch (err) {
        console.error('[determineStartScreen] Error checking cloud data:', err);
        // Continue with normal flow if cloud check fails
      }
    } else {
      console.log('[determineStartScreen] Offline, skipping cloud data check');
    }

    // Si tiene sesión pero NO completó onboarding, debe continuar con First Config
    // Esto cubre el caso de usuarios nuevos que acaban de verificar OTP
    console.log('[determineStartScreen] → CONTINUE (sesión activa pero onboarding incompleto)');
    return 'continue';
  }

  // CASO 2: Onboarding ya completado (guest mode) → APP
  // Si el onboarding ya se completó alguna vez, dejar usar la app
  // (funciona en guest mode si no hay sesión ni logout)
  if (onboardingEverCompleted) {
    console.log('[determineStartScreen] → APP (onboarding completado, guest mode)');
    return 'app';
  }

  // CASO 3: Primera vez (nunca completó onboarding)
  // Check legacy welcome para migración
  const legacyWelcomeSeen = localStorage.getItem(LEGACY_WELCOME_KEY);
  if (legacyWelcomeSeen === '1') {
    // Usuario legacy: migrar y enviar directo a app (ya tiene datos)
    markOnboardingComplete();
    console.log('[determineStartScreen] → APP (legacy migrated)');
    return 'app';
  }

  // Si hay progreso guardado, continuar desde donde estaba
  if (savedProgress && savedProgress.phase) {
    console.log('[determineStartScreen] → CONTINUE (progreso guardado en fase:', savedProgress.phase, ')');
    return 'continue'; // El Gate NO debe redirigir, dejar que continue
  }

  // ✅ CHECK: Verify if user has already gone through FirstConfig before
  // device_initialized is a PERMANENT flag that is set ONLY when user completes FirstConfig
  // This flag is NEVER cleared (not even on logout), so it persists across sessions
  // If true → user has already used the app on this device before → skip Welcome
  const deviceInitialized = localStorage.getItem(ONBOARDING_KEYS.DEVICE_INITIALIZED) === 'true';

  if (deviceInitialized) {
    console.log('[determineStartScreen] → LOGIN (device already initialized, skipping Welcome)');
    return 'login';
  }

  console.log('[determineStartScreen] → ONBOARDING (primera vez en este dispositivo)');
  return 'onboarding'; // Welcome → Login → Config
}

/**
 * Marca el onboarding como completado
 */
export function markOnboardingComplete() {
  const now = Date.now();

  localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
  localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, now.toString());

  console.log('[Onboarding] Marked as completed at:', new Date(now).toLocaleString());
}

/**
 * Migra desde el legacy welcome
 */
export function migrateFromLegacyWelcome() {
  const legacySeen = localStorage.getItem(LEGACY_WELCOME_KEY);
  if (legacySeen === '1') {
    // Usuario ya pasó por el welcome anterior
    localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());

    // Eliminar key legacy
    localStorage.removeItem(LEGACY_WELCOME_KEY);

    console.log('[Onboarding] Migrated from legacy welcome');
  }
}

/**
 * Check si el onboarding fue completado
 */
export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
}

/**
 * Get saved progress
 */
export function getSavedProgress() {
  const saved = localStorage.getItem(ONBOARDING_KEYS.PROGRESS);
  return saved ? JSON.parse(saved) : null;
}

/**
 * Get saved selections
 */
export function getSavedSelections() {
  const saved = localStorage.getItem(ONBOARDING_KEYS.SELECTIONS);
  return saved ? JSON.parse(saved) : {};
}

/**
 * Marca que el usuario hizo logout explícito
 * Para mostrarle el login screen en lugar del welcome
 */
export function markLogout() {
  localStorage.setItem(ONBOARDING_KEYS.LOGOUT, 'true');

  // Clear ALL onboarding state so next user starts fresh
  // This ensures that a new user will go through FirstConfig
  localStorage.removeItem(ONBOARDING_KEYS.COMPLETED);
  localStorage.removeItem(ONBOARDING_KEYS.PROGRESS);
  localStorage.removeItem(ONBOARDING_KEYS.SELECTIONS);
  localStorage.removeItem(ONBOARDING_KEYS.TIMESTAMP);

  console.log('[Onboarding] Logout marked, onboarding state cleared for next user');
}
