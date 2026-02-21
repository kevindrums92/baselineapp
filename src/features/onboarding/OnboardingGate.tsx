/**
 * OnboardingGate
 * Componente que decide si mostrar onboarding o dejar pasar a la app
 * Similar al WelcomeGate anterior pero con el nuevo sistema
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { determineStartScreen, migrateFromLegacyWelcome, getSavedProgress } from './utils/onboarding.helpers';

// Safety timeout: if determineStartScreen takes too long, default to 'app'
// This prevents infinite loading spinners when offline with expired tokens
const GATE_TIMEOUT_MS = 4000;

export default function OnboardingGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const initialCheckDone = useRef(false);

  // Safety timeout: never show loading spinner for more than GATE_TIMEOUT_MS
  useEffect(() => {
    if (!isChecking) return;

    const timeout = setTimeout(() => {
      if (isChecking) {
        console.warn('[OnboardingGate] Safety timeout reached, stopping loading overlay');
        setIsChecking(false);
        initialCheckDone.current = true;
      }
    }, GATE_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isChecking]);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip re-checking for intra-onboarding navigation after initial check
      // The Gate only needs to determine the starting point once — after that,
      // the Flow components (WelcomeOnboardingFlow, ConfigFlow) handle navigation
      if (initialCheckDone.current && location.pathname.startsWith('/onboarding')) {
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      // Permitir rutas auxiliares durante el onboarding (ej: crear categoría)
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('returnTo') === 'onboarding') {
        console.log('[OnboardingGate] Allowing auxiliary route during onboarding:', location.pathname);
        setIsChecking(false);
        initialCheckDone.current = true;
        return;
      }

      // Migrar desde legacy welcome si existe
      migrateFromLegacyWelcome();

      // Determinar qué pantalla mostrar
      const startScreen = await determineStartScreen();

      console.log('[OnboardingGate] Start screen:', startScreen, 'Current path:', location.pathname);

      // CASO 1: Debe ir a onboarding completo (primera vez, sin progreso)
      if (startScreen === 'onboarding') {
        // Si no estamos en welcome, redirigir
        if (!location.pathname.startsWith('/onboarding/welcome')) {
          console.log('[OnboardingGate] Redirecting to welcome/1');
          navigate('/onboarding/welcome/1', { replace: true });
        } else {
          setIsChecking(false);
        }
      }
      // CASO 2: Continuar desde progreso guardado
      else if (startScreen === 'continue') {
        console.log('[OnboardingGate] Continuing from saved progress');

        // ONLY redirect if user is OUTSIDE onboarding
        // If already inside onboarding, let WelcomeOnboardingFlow/ConfigFlow handle it
        if (!location.pathname.startsWith('/onboarding')) {
          const savedProgress = getSavedProgress();

          if (savedProgress && savedProgress.phase && savedProgress.step) {
            // Build the expected path from saved progress
            const savedPath = savedProgress.phase === 'login'
              ? '/onboarding/login'
              : `/onboarding/${savedProgress.phase}/${savedProgress.step}`;

            console.log('[OnboardingGate] Not in onboarding, redirecting to saved progress:', savedPath);
            navigate(savedPath, { replace: true });
          } else {
            // Fallback: si no hay progreso válido y está fuera de onboarding, ir a config/1
            console.log('[OnboardingGate] No valid progress, redirecting to First Config');
            navigate('/onboarding/config/1', { replace: true });
          }
        } else {
          console.log('[OnboardingGate] Already in onboarding, letting Flow components handle navigation');
          setIsChecking(false);
        }
      }
      // CASO 3: Debe ir a login directo (returning user)
      else if (startScreen === 'login') {
        // Permitir rutas de auth (login, auth pages, reset password)
        const isAuthRoute =
          location.pathname === '/onboarding/login' ||
          location.pathname.startsWith('/onboarding/auth') ||
          location.pathname.startsWith('/onboarding/reset-password');

        // Si no estamos en una ruta de auth, redirigir a login
        if (!isAuthRoute) {
          console.log('[OnboardingGate] Redirecting to login');
          navigate('/onboarding/login', { replace: true });
        } else {
          setIsChecking(false);
        }
      }
      // CASO 4: Debe ir a app
      else if (startScreen === 'app') {
        // Allow specific onboarding routes even with active session:
        // - Password reset flow (OTP verification creates session, user needs to change password)
        // - First config flow (New user just verified OTP, needs to complete config)
        // - Login/Auth routes (Guest users who completed onboarding can sign in)
        const isPasswordResetRoute = location.pathname.startsWith('/onboarding/reset-password');
        const isConfigRoute = location.pathname.startsWith('/onboarding/config');
        const isLoginRoute =
          location.pathname === '/onboarding/login' ||
          location.pathname.startsWith('/onboarding/auth');

        // Si estamos en onboarding (pero no en rutas permitidas), salir a app
        if (location.pathname.startsWith('/onboarding') && !isPasswordResetRoute && !isConfigRoute && !isLoginRoute) {
          console.log('[OnboardingGate] Redirecting to app');
          navigate('/', { replace: true });
        } else {
          setIsChecking(false);
        }
      }

      // Mark initial check as done so intra-onboarding navigation skips re-checking
      initialCheckDone.current = true;
    };

    checkOnboarding();
  }, [navigate, location.pathname, location.search]);

  // Mostrar loading mientras se está verificando para evitar flashes de contenido
  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 dark:border-gray-800 dark:border-t-emerald-400" />
          {/* Optional: Loading text */}
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // No renderiza nada cuando ya está en la ruta correcta
  return null;
}
