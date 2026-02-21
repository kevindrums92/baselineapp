/**
 * useOnboardingProgress
 * Hook para manejar la navegación y progreso del onboarding
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../OnboardingContext';
import { PHASE_SCREEN_COUNTS } from '../utils/onboarding.constants';
import type { OnboardingPhase } from '../utils/onboarding.types';

export function useOnboardingProgress() {
  const navigate = useNavigate();
  const { state, updatePhase, updateStep, completeOnboarding } =
    useOnboarding();

  const navigateToPhase = useCallback(
    (phase: OnboardingPhase, step: number = 1) => {
      console.log('[useOnboardingProgress] navigateToPhase called:', { phase, step, currentPhase: state.phase, currentStep: state.step });

      // Only update phase if it's actually changing
      if (state.phase !== phase) {
        updatePhase(phase);
        // updatePhase resets step to 1, so we need to update step after
        if (step !== 1) {
          updateStep(step);
        }
      } else {
        // Same phase, just update the step
        updateStep(step);
      }

      switch (phase) {
        case 'welcome':
          navigate(`/onboarding/welcome/${step}`);
          break;
        case 'login':
          navigate('/onboarding/login');
          break;
        case 'config':
          navigate(`/onboarding/config/${step}`);
          break;
        case 'complete':
          completeOnboarding();
          navigate('/');
          break;
      }
    },
    [navigate, state.phase, state.step, updatePhase, updateStep, completeOnboarding]
  );

  const handleNext = useCallback(() => {
    const { phase, step } = state;
    const maxSteps = PHASE_SCREEN_COUNTS[phase as keyof typeof PHASE_SCREEN_COUNTS];

    console.log('[useOnboardingProgress] handleNext called:', { phase, step, maxSteps });

    if (step < maxSteps) {
      // Next step in current phase
      console.log('[useOnboardingProgress] Moving to next step:', step + 1);
      navigateToPhase(phase, step + 1);
    } else {
      // Move to next phase
      console.log('[useOnboardingProgress] Moving to next phase');
      switch (phase) {
        case 'welcome':
          navigateToPhase('config');
          break;
        case 'login':
          // Login phase doesn't auto-advance
          // Auth success handlers will call navigateToPhase('config') or navigateToPhase('complete')
          break;
        case 'config':
          navigateToPhase('complete');
          break;
      }
    }
  }, [state, navigateToPhase]);

  const handleBack = useCallback(() => {
    const { phase, step } = state;

    if (step > 1) {
      // Previous step in current phase
      navigateToPhase(phase, step - 1);
    } else {
      // Move to previous phase
      switch (phase) {
        case 'login':
          navigateToPhase('welcome', PHASE_SCREEN_COUNTS.welcome);
          break;
        case 'config':
          navigateToPhase('welcome', PHASE_SCREEN_COUNTS.welcome);
          break;
        // Welcome phase at step 1: no back
      }
    }
  }, [state, navigateToPhase]);

  const handleSkip = useCallback(() => {
    const { phase } = state;

    if (phase === 'welcome') {
      // Skip directly to Complete screen in FirstConfig
      navigateToPhase('config', 5);
    } else if (phase === 'config') {
      // Skip directly to Complete screen (screen 5)
      // Don't call skipConfig() as it would mark config as skipped
      navigateToPhase('config', 5);
    }
  }, [state, navigateToPhase]);

  return {
    navigateToPhase,
    handleNext,
    handleBack,
    handleSkip,
    currentPhase: state.phase,
    currentStep: state.step,
    isFirstTime: state.isFirstTime,
    isReturningUser: state.isReturningUser,
  };
}
