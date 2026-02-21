/**
 * Screen4_HabitsAnalysis
 * Pantalla 4: Análisis de Hábitos
 * Visualización de patrones de gasto con gráficas
 */

import { TrendingUp, Calendar, DollarSign, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen4_HabitsAnalysis() {
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
      headerCenter={<ProgressDots total={6} current={4} />}
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
          className="w-full rounded-2xl bg-gray-900 py-4 text-base font-bold text-white transition-all active:scale-[0.98]"
        >
          {t('welcome.screen4.continue')}
        </button>
      }
      contentClassName="pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen4.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen4.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Chart Example */}
      <SlideAnimation direction="up" delay={100}>
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
          {/* Chart Title */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('welcome.screen4.chartTitle')}</p>
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1">
              <TrendingUp size={12} className="text-emerald-600" strokeWidth={3} />
              <span className="text-xs font-bold text-emerald-600">-12%</span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="mb-3 space-y-2">
            <div className="flex h-40 items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 90, 70].map((heightValue, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#18B7B0] to-[#18B7B0]/70"
                    style={{ height: `${heightValue}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              {[t('welcome.screen4.dayMon'), t('welcome.screen4.dayTue'), t('welcome.screen4.dayWed'), t('welcome.screen4.dayThu'), t('welcome.screen4.dayFri'), t('welcome.screen4.daySat'), t('welcome.screen4.daySun')].map((day, i) => (
                <div key={i} className="flex-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex justify-center">
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Stats */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen4.avgDaily')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">$ 45.000</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen4.weeklyTotal')}</p>
              <p className="font-bold text-gray-900 dark:text-gray-50">$ 315.000</p>
            </div>
          </div>
        </div>
      </SlideAnimation>

      {/* Insights Cards */}
      <div className="space-y-3">
        <SlideAnimation direction="up" delay={150}>
          <div className="flex items-start gap-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800/50">
              <Calendar size={18} className="text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen4.insight1Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen4.insight1Desc')}</p>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800/50">
              <DollarSign size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen4.insight2Title')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.screen4.insight2Desc')}</p>
            </div>
          </div>
        </SlideAnimation>
      </div>

    </FullscreenLayout>
  );
}
