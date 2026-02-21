/**
 * OnboardingContext
 * Context provider para manejar el estado global del onboarding
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  OnboardingState,
  OnboardingContextValue,
  OnboardingPhase,
  AuthMethod,
} from './utils/onboarding.types';
import {
  ONBOARDING_KEYS,
  LEGACY_WELCOME_KEY,
  DEFAULT_ONBOARDING_STATE,
} from './utils/onboarding.constants';

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);

  // Initialize state from localStorage
  useEffect(() => {
    const initializeState = () => {
      // Check if onboarding was ever completed
      const completed = localStorage.getItem(ONBOARDING_KEYS.COMPLETED) === 'true';
      const savedProgress = localStorage.getItem(ONBOARDING_KEYS.PROGRESS);
      const savedSelections = localStorage.getItem(ONBOARDING_KEYS.SELECTIONS);

      // Migración de legacy welcome
      const legacyWelcome = localStorage.getItem(LEGACY_WELCOME_KEY);
      if (legacyWelcome === '1' && !completed) {
        // Usuario legacy: marcar como completado
        localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
        localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, Date.now().toString());
        localStorage.removeItem(LEGACY_WELCOME_KEY);
        console.log('[Onboarding] Migrated from legacy welcome');
      }

      const progress = savedProgress ? JSON.parse(savedProgress) : null;
      const selections = savedSelections ? JSON.parse(savedSelections) : {};

      // IMPORTANTE: Si no hay nada en localStorage, usar valores por defecto
      // NO persistir inmediatamente para evitar race condition con OnboardingGate
      const initialState = {
        ...DEFAULT_ONBOARDING_STATE,
        completed,
        isFirstTime: !completed,
        isReturningUser: completed,
        phase: progress?.phase || 'welcome',
        step: progress?.step || 1,
        welcomeSkipped: progress?.welcomeSkipped || false,
        configSkipped: progress?.configSkipped || false,
        selections,
      };

      setState(initialState);

      console.log('[OnboardingContext] Initialized:', {
        completed,
        isFirstTime: !completed,
        phase: initialState.phase,
        step: initialState.step,
        hasProgress: !!savedProgress,
      });
    };

    initializeState();
  }, []);

  // Persist progress to localStorage
  const persistProgress = useCallback(() => {
    const progress = {
      phase: state.phase,
      step: state.step,
      welcomeSkipped: state.welcomeSkipped,
      configSkipped: state.configSkipped,
    };
    localStorage.setItem(ONBOARDING_KEYS.PROGRESS, JSON.stringify(progress));
  }, [state.phase, state.step, state.welcomeSkipped, state.configSkipped]);

  // Persist selections to localStorage
  const persistSelections = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEYS.SELECTIONS, JSON.stringify(state.selections));
  }, [state.selections]);

  // Auto-persist on state changes
  useEffect(() => {
    if (state.phase !== 'welcome' || state.step !== 1) {
      persistProgress();
    }
  }, [state.phase, state.step, persistProgress]);

  useEffect(() => {
    if (Object.keys(state.selections).length > 0) {
      persistSelections();
    }
  }, [state.selections, persistSelections]);

  const updatePhase = useCallback((phase: OnboardingPhase) => {
    setState((prev) => ({
      ...prev,
      phase,
      step: 1, // Reset step when changing phase
    }));
    console.log('[Onboarding] Phase updated:', phase);
  }, []);

  const updateStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      step,
    }));
    console.log('[Onboarding] Step updated:', step);
  }, []);

  const setAuthMethod = useCallback((method: AuthMethod) => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        authMethod: method,
      },
    }));
    console.log('[Onboarding] Auth method selected:', method);
  }, []);

  const setLanguage = useCallback((language: string) => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        language,
      },
    }));
    console.log('[Onboarding] Language selected:', language);
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        theme,
      },
    }));
    console.log('[Onboarding] Theme selected:', theme);
  }, []);

  const setCurrency = useCallback((currency: string) => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        currency,
      },
    }));
    console.log('[Onboarding] Currency selected:', currency);
  }, []);

  const setSelectedPlan = useCallback((plan: 'monthly' | 'annual' | 'lifetime' | null) => {
    setState((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        selectedPlan: plan,
      },
    }));
    console.log('[Onboarding] Plan selected:', plan);
  }, []);

  const skipWelcome = useCallback(() => {
    setState((prev) => ({
      ...prev,
      welcomeSkipped: true,
      phase: 'login',
      step: 1,
    }));
    console.log('[Onboarding] Welcome skipped → Login');
  }, []);

  const skipConfig = useCallback(() => {
    setState((prev) => ({
      ...prev,
      configSkipped: true,
    }));
    console.log('[Onboarding] Config skipped');
  }, []);

  const completeOnboarding = useCallback(() => {
    const now = Date.now();

    setState((prev) => ({
      ...prev,
      completed: true,
      phase: 'complete',
      firstCompletedAt: prev.firstCompletedAt || now,
      lastLoginAt: now,
    }));

    localStorage.setItem(ONBOARDING_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_KEYS.TIMESTAMP, now.toString());

    console.log('[Onboarding] Completed at:', new Date(now).toLocaleString());
  }, []);

  const resetOnboarding = useCallback(() => {
    // Para testing/debugging
    localStorage.removeItem(ONBOARDING_KEYS.COMPLETED);
    localStorage.removeItem(ONBOARDING_KEYS.PROGRESS);
    localStorage.removeItem(ONBOARDING_KEYS.SELECTIONS);
    localStorage.removeItem(ONBOARDING_KEYS.TIMESTAMP);

    setState(DEFAULT_ONBOARDING_STATE);

    console.log('[Onboarding] Reset complete');
  }, []);

  const value: OnboardingContextValue = {
    state,
    updatePhase,
    updateStep,
    setAuthMethod,
    setLanguage,
    setTheme,
    setCurrency,
    setSelectedPlan,
    skipWelcome,
    skipConfig,
    completeOnboarding,
    resetOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
