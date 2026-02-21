/**
 * OnboardingLayout
 * Layout wrapper común para todas las pantallas de onboarding
 * Mobile-first, con safe area insets y animaciones
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProgressDots from './ProgressDots';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export default function OnboardingLayout({
  children,
  showBackButton = false,
  onBack,
  showSkip = false,
  onSkip,
  skipLabel,
  showProgress = false,
  currentStep = 1,
  totalSteps = 6,
  className = '',
}: OnboardingLayoutProps) {
  const { t } = useTranslation('common');
  return (
    <div
      className={`relative flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950 ${className}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Header */}
      <header
        className="z-10 flex shrink-0 items-center justify-between px-6 pb-2 pt-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
        }}
      >
        {/* Back Button */}
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Volver"
          >
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        ) : (
          <div className="h-10 w-10" /> // Spacer
        )}

        {/* Progress Dots */}
        {showProgress && (
          <ProgressDots total={totalSteps} current={currentStep} />
        )}

        {/* Skip Button */}
        {showSkip && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            {skipLabel || t('buttons.skip')}
          </button>
        ) : (
          <div className="h-10 w-10" /> // Spacer
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
        {children}
      </main>
    </div>
  );
}
