/**
 * Screen1_Welcome
 * Pantala 1: Bienvenido a BaselineApp
 * Primera impresión - Logo, título y features principales
 */

import { WifiOff, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import FeatureCard from '../../../components/FeatureCard';
import SlideAnimation, { StaggeredAnimation } from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen1_Welcome() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { handleNext, handleSkip } = useOnboardingProgress();

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={6} current={1} />}
      headerRight={
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('common:buttons.skip')}
        </button>
      }
      ctaButton={
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-gradient-to-r from-[#18B7B0] to-[#0F8580] py-4 text-base font-bold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          {t('welcome.screen1.start')}
        </button>
      }
      contentClassName="pb-8"
    >
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <SlideAnimation direction="down" delay={0}>
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0d9488] shadow-lg">
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
              <rect x="10" y="35" width="8" height="15" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="26" y="25" width="8" height="25" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="42" y="20" width="8" height="30" rx="2" fill="white" fillOpacity="0.9"/>
              <path d="M8 40 L22 28 L36 32 L52 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="52" cy="14" r="3" fill="white"/>
            </svg>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen1.title1')}
            <br />
            <span className="bg-gradient-to-r from-[#18B7B0] to-[#0F8580] bg-clip-text text-transparent">
              {t('welcome.screen1.title2')}
            </span>
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={150}>
          <p className="mx-auto max-w-sm text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen1.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <StaggeredAnimation staggerDelay={80}>
          <FeatureCard
            icon={WifiOff}
            title={t('welcome.screen1.feature1Title')}
            description={t('welcome.screen1.feature1Desc')}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            compact
          />

          <FeatureCard
            icon={Shield}
            title={t('welcome.screen1.feature2Title')}
            description={t('welcome.screen1.feature2Desc')}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            compact
          />

          <FeatureCard
            icon={TrendingUp}
            title={t('welcome.screen1.feature3Title')}
            description={t('welcome.screen1.feature3Desc')}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
            compact
          />
        </StaggeredAnimation>
      </div>
    </FullscreenLayout>
  );
}
