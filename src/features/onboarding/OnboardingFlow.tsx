/**
 * OnboardingFlow
 * Router principal del flujo de onboarding
 * Decide qué mostrar basado en el estado del usuario
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingProvider } from './OnboardingContext';

// Import phases
import WelcomeOnboardingFlow from './phases/WelcomeOnboarding';
import LoginFlow from './phases/LoginFlow';
import FirstConfigFlow from './phases/FirstConfig';

// Import auth pages
import {
  AuthPage,
  OTPVerificationPage,
  ResetPasswordOTPPage,
  ResetPasswordPage,
} from '@/features/auth';

/**
 * OnboardingRouter - Componente interno que maneja el routing
 * IMPORTANTE: Este componente NO determina dónde empezar el onboarding.
 * Esa lógica está en OnboardingGate. Este solo renderiza las rutas.
 */
function OnboardingRouter() {
  return (
    <Routes>
      {/* Welcome Onboarding - 6 screens */}
      <Route path="welcome/:step" element={<WelcomeOnboardingFlow />} />

      {/* Login Flow (for logout/re-login, not part of initial onboarding) */}
      <Route path="login" element={<LoginFlow />} />

      {/* Auth Flow - Email/Password + OTP */}
      <Route path="auth" element={<AuthPage />} />
      <Route path="auth/verify" element={<OTPVerificationPage />} />

      {/* Password Reset Flow */}
      <Route path="reset-password/verify" element={<ResetPasswordOTPPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />

      {/* First Config - 4 screens */}
      <Route path="config/:step" element={<FirstConfigFlow />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/onboarding/welcome/1" replace />} />
    </Routes>
  );
}

/**
 * OnboardingFlow - Componente principal exportado
 */
export default function OnboardingFlow() {
  return (
    <OnboardingProvider>
      <OnboardingRouter />
    </OnboardingProvider>
  );
}
