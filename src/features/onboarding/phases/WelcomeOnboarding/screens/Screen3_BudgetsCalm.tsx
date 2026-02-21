/**
 * Screen3_BudgetsCalm
 * Pantalla 3: Presupuestos Tranquilos
 * Gestión de presupuestos sin estrés con categorías
 */

import { Coffee, ShoppingBag, Home, TrendingDown, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen3_BudgetsCalm() {
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
      headerCenter={<ProgressDots total={6} current={3} />}
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
          {t('welcome.screen3.continue')}
        </button>
      }
      contentClassName="pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen3.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen3.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Category Cards Example */}
      <div className="mb-6 space-y-3">
        <SlideAnimation direction="up" delay={100}>
          {/* Alimentación */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                  <Coffee size={20} className="text-orange-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen3.categoryFood')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">$ 245.000 de $ 400.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">61%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full w-[61%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={150}>
          {/* Compras */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                  <ShoppingBag size={20} className="text-purple-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen3.categoryShop')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">$ 180.000 de $ 200.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-600">90%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full w-[90%] rounded-full bg-amber-500" />
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          {/* Hogar */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                  <Home size={20} className="text-blue-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen3.categoryHome')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">$ 320.000 de $ 500.000</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600">64%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full w-[64%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </SlideAnimation>
      </div>

      {/* Info card */}
      <SlideAnimation direction="up" delay={250}>
        <div className="flex gap-3 rounded-xl bg-[#18B7B0]/10 p-4">
          <TrendingDown size={20} className="mt-0.5 shrink-0 text-[#18B7B0]" strokeWidth={2.5} />
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {t('welcome.screen3.alertNote')}
          </p>
        </div>
      </SlideAnimation>

    </FullscreenLayout>
  );
}
