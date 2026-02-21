/**
 * Onboarding Feature - Main exports
 */

export { default as OnboardingFlow } from './OnboardingFlow';
export { default as OnboardingGate } from './OnboardingGate';
export { OnboardingProvider, useOnboarding } from './OnboardingContext';
export { useOnboardingProgress } from './hooks/useOnboardingProgress';
export { useOnboardingPersistence } from './hooks/useOnboardingPersistence';

// Components
export { default as OnboardingLayout } from './components/OnboardingLayout';
export { default as ProgressDots } from './components/ProgressDots';
export { default as FeatureCard } from './components/FeatureCard';
export { default as AuthButton } from './components/AuthButton';
export { default as ConfigOption } from './components/ConfigOption';
export { default as SlideAnimation, StaggeredAnimation } from './components/SlideAnimation';

// Types and Constants
export * from './utils/onboarding.types';
export * from './utils/onboarding.constants';
export * from './utils/onboarding.helpers';
