/**
 * useOnboardingPersistence
 * Hook para manejar la persistencia del onboarding en localStorage
 */

import { useCallback } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ONBOARDING_KEYS, LEGACY_WELCOME_KEY } from '../utils/onboarding.constants';
import { supabase } from '@/lib/supabaseClient';

export function useOnboardingPersistence() {
  const { state, resetOnboarding } = useOnboarding();

  /**
   * Marca el onboarding como completado
   */
  const markOnboardingComplete = useCallback(() => {
    const now = Date.now();

    localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, now.toString());

    // Opcional: guardar selecciones finales
    if (Object.keys(state.selections).length > 0) {
      localStorage.setItem(
        ONBOARDING_KEYS.SELECTIONS,
        JSON.stringify(state.selections)
      );
    }

    console.log('[Onboarding] Marked as completed at:', new Date(now).toLocaleString());
  }, [state.selections]);

  /**
   * Determina qué pantalla mostrar al iniciar la app
   */
  const determineStartScreen = useCallback(
    async (): Promise<'app' | 'onboarding' | 'login'> => {
      // 1. Check si el onboarding ya se completó alguna vez
      const onboardingEverCompleted =
        localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';

      // 2. Check si hay sesión activa
      const { data } = await supabase.auth.getSession();
      const hasActiveSession = !!data.session;

      // CASO 1: Usuario con sesión activa → APP
      if (hasActiveSession) {
        // Si tiene sesión pero nunca hizo onboarding, marcarlo como completado
        // (esto cubre casos edge como deep links o sesiones previas)
        if (!onboardingEverCompleted) {
          markOnboardingComplete();
        }
        return 'app';
      }

      // CASO 2: Primera vez (nunca completó onboarding) → ONBOARDING COMPLETO
      if (!onboardingEverCompleted) {
        // Check legacy welcome para migración
        const legacyWelcomeSeen = localStorage.getItem(LEGACY_WELCOME_KEY);
        if (legacyWelcomeSeen === '1') {
          // Usuario legacy: migrar y enviar directo a app (ya tiene datos)
          markOnboardingComplete();
          return 'app';
        }

        return 'onboarding'; // Welcome → Login → Config
      }

      // CASO 3: Logout (ya completó onboarding antes) → LOGIN DIRECTO
      // Usuario returning que se deslogueó, solo mostrar login
      return 'login';
    },
    [markOnboardingComplete]
  );

  /**
   * Migra desde el legacy welcome
   */
  const migrateFromLegacyWelcome = useCallback(() => {
    const legacySeen = localStorage.getItem(LEGACY_WELCOME_KEY);
    if (legacySeen === '1') {
      // Usuario ya pasó por el welcome anterior
      localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
      localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());

      // Eliminar key legacy
      localStorage.removeItem(LEGACY_WELCOME_KEY);

      console.log('[Onboarding] Migrated from legacy welcome');
    }
  }, []);

  /**
   * Check si el onboarding fue completado
   */
  const isOnboardingCompleted = useCallback(() => {
    return localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
  }, []);

  /**
   * Get saved progress
   */
  const getSavedProgress = useCallback(() => {
    const saved = localStorage.getItem(ONBOARDING_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : null;
  }, []);

  /**
   * Get saved selections
   */
  const getSavedSelections = useCallback(() => {
    const saved = localStorage.getItem(ONBOARDING_KEYS.SELECTIONS);
    return saved ? JSON.parse(saved) : {};
  }, []);

  return {
    determineStartScreen,
    markOnboardingComplete,
    migrateFromLegacyWelcome,
    isOnboardingCompleted,
    getSavedProgress,
    getSavedSelections,
    resetOnboarding, // From context
  };
}
