import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import * as Sentry from "@sentry/react";

import { ThemeProvider } from "@/features/theme";
import { CurrencyProvider } from "@/features/currency";
import { PrivacyProvider } from "@/features/privacy";
import BottomBar from "@/shared/components/layout/BottomBar";
import TopHeader from "@/shared/components/layout/TopHeader";
import { HeaderActionsProvider } from "@/shared/contexts/headerActions.context";
import RevenueCatProvider from "@/shared/components/providers/RevenueCatProvider";
import { showBanner, hideBanner, removeBanner } from "@/services/ads.service";
import { useSubscription } from "@/hooks/useSubscription";
import { isNative } from "@/shared/utils/platform";

import CloudSyncGate from "@/shared/components/providers/CloudSyncGate";
import AdMobProvider from "@/shared/components/providers/AdMobProvider";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import OnboardingGate from "@/features/onboarding/OnboardingGate";
import BiometricGate from "@/features/biometric/components/BiometricGate";
import SessionExpiredGate from "@/features/session/components/SessionExpiredGate";


// Lazy load pages
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));
const LanguageSettingsPage = lazy(() => import("@/features/profile/pages/LanguageSettingsPage"));
const ThemeSettingsPage = lazy(() => import("@/features/profile/pages/ThemeSettingsPage"));
const CurrencySettingsPage = lazy(() => import("@/features/profile/pages/CurrencySettingsPage"));
const NotificationSettingsPage = lazy(() => import("@/features/notifications/pages/NotificationSettingsPage"));
const SubscriptionManagementPage = lazy(() => import("@/features/profile/pages/SubscriptionManagementPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 dark:border-gray-700 dark:border-t-emerald-400" />
      </div>
    </div>
  );
}

// Placeholder home page — replace with your app's home
function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 pt-20 pb-24 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-50">
          BaselineApp
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your baseline is ready. Start building your next app from here.
        </p>
      </div>
    </div>
  );
}

function AppFrame() {
  const location = useLocation();

  const isFormRoute =
    location.pathname.startsWith("/settings/") ||
    location.pathname.startsWith("/profile/subscription") ||
    location.pathname.startsWith("/onboarding");

  // Banner ads: show on form routes for non-Pro users
  const { isPro } = useSubscription();
  const isNoBannerRoute =
    location.pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isNative()) return;

    if (isFormRoute && !isPro && !isNoBannerRoute) {
      showBanner();
    } else {
      hideBanner();
    }

    return () => { removeBanner(); };
  }, [isFormRoute, isPro, isNoBannerRoute]);

  return (
    <>
      <div className="min-h-dvh bg-white dark:bg-gray-950">
        {!isFormRoute && <TopHeader />}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Onboarding routes */}
            <Route path="/onboarding/*" element={<OnboardingFlow />} />

            {/* Main app routes */}
            <Route path="/" element={<HomePage />} />

            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/subscription" element={<SubscriptionManagementPage />} />

            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/theme" element={<ThemeSettingsPage />} />
            <Route path="/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {!isFormRoute && <BottomBar />}
      </div>
    </>
  );
}

function ErrorFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          An unexpected error occurred. Please restart the application.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider>
        <CurrencyProvider>
          <PrivacyProvider>
            <RevenueCatProvider>
              <AdMobProvider>
                <BrowserRouter>
                  <HeaderActionsProvider>
                    <CloudSyncGate />
                    <OnboardingGate />
                    <BiometricGate />
                    <SessionExpiredGate />
                    <AppFrame />
                  </HeaderActionsProvider>
                </BrowserRouter>
              </AdMobProvider>
            </RevenueCatProvider>
          </PrivacyProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}
