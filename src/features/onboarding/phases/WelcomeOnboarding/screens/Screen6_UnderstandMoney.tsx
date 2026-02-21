/**
 * Screen6_UnderstandMoney
 * Pantalla 6: Entiende tu Plata
 * Dashboard de insights financieros con donut chart
 */

import { PieChart, TrendingUp, Calendar, Award, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen6_UnderstandMoney() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { handleNext, handleBack, handleSkip } = useOnboardingProgress();

  return (
    <FullscreenLayout
      headerLeft={
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
          aria-label="Volver"
        >
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
      }
      headerCenter={<ProgressDots total={6} current={6} />}
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
          data-testid="welcome-start-button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-gradient-to-r from-[#18B7B0] to-[#0F8580] py-4 text-base font-bold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          {t('welcome.screen6.startNow')}
        </button>
      }
      contentClassName="pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen6.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen6.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Donut Chart Card */}
      <SlideAnimation direction="up" delay={100}>
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          {/* Chart Title */}
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('welcome.screen6.distributionTitle')}</p>
          </div>

          {/* Simple Donut Chart */}
          <div className="mb-4 flex items-center justify-center">
            <div className="relative h-40 w-40">
              {/* Background ring */}
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                {/* Donut segments */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#FF6B6B"
                  strokeWidth="20"
                  strokeDasharray="126 314"
                  strokeDashoffset="0"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#4ECDC4"
                  strokeWidth="20"
                  strokeDasharray="94 314"
                  strokeDashoffset="-126"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#95E1D3"
                  strokeWidth="20"
                  strokeDasharray="63 314"
                  strokeDashoffset="-220"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#F38181"
                  strokeWidth="20"
                  strokeDasharray="31 314"
                  strokeDashoffset="-283"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">100%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen6.total')}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF6B6B]" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('welcome.screen6.catFood')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">40%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#4ECDC4]" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('welcome.screen6.catHome')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#95E1D3]" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('welcome.screen6.catTransport')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#F38181]" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('welcome.screen6.catOthers')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">10%</span>
            </div>
          </div>
        </div>
      </SlideAnimation>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SlideAnimation direction="up" delay={150}>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
            <TrendingUp size={18} className="mb-2 text-[#18B7B0]" strokeWidth={2.5} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen6.avgDaily')}</p>
            <p className="font-bold text-gray-900 dark:text-gray-50">$ 45K</p>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
            <Award size={18} className="mb-2 text-amber-500" strokeWidth={2.5} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen6.topCategory')}</p>
            <p className="font-bold text-gray-900 dark:text-gray-50">{t('welcome.screen6.topCategoryFood')}</p>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={250}>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
            <Calendar size={18} className="mb-2 text-purple-500" strokeWidth={2.5} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen6.peakDay')}</p>
            <p className="font-bold text-gray-900 dark:text-gray-50">{t('welcome.screen6.peakDayFriday')}</p>
          </div>
        </SlideAnimation>
      </div>

    </FullscreenLayout>
  );
}
