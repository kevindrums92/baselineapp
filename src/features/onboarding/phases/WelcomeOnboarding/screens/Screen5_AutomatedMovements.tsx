/**
 * Screen5_AutomatedMovements
 * Pantalla 5: Automatización de Movimientos
 * Transacciones recurrentes automáticas con timeline
 */

import { Repeat, Wifi, Calendar, CreditCard, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';
import SlideAnimation from '../../../components/SlideAnimation';
import { useOnboardingProgress } from '../../../hooks/useOnboardingProgress';

export default function Screen5_AutomatedMovements() {
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
      headerCenter={<ProgressDots total={6} current={5} />}
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
          {t('welcome.screen5.continue')}
        </button>
      }
      contentClassName="pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <SlideAnimation direction="right" delay={0}>
          <div className="mb-4 inline-flex rounded-full bg-indigo-100 px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
              <Repeat size={16} strokeWidth={3} />
              {t('welcome.screen5.badge')}
            </span>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={50}>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
            {t('welcome.screen5.title')}
          </h1>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={100}>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {t('welcome.screen5.subtitle')}
          </p>
        </SlideAnimation>
      </div>

      {/* Timeline of Recurring Transactions */}
      <div className="relative mb-6 space-y-4">
        {/* Vertical Line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <SlideAnimation direction="up" delay={150}>
          {/* Transaction 1 - Netflix */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 shadow-sm">
              <Wifi size={18} className="text-red-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen5.netflix')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen5.every1st')}</p>
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-50">$ 45.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">{t('welcome.screen5.active')}</p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={200}>
          {/* Transaction 2 - Arriendo */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 shadow-sm">
              <Calendar size={18} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen5.rent')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen5.every5th')}</p>
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-50">$ 800.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">{t('welcome.screen5.active')}</p>
              </div>
            </div>
          </div>
        </SlideAnimation>

        <SlideAnimation direction="up" delay={250}>
          {/* Transaction 3 - Tarjeta */}
          <div className="relative flex items-start gap-4">
            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 shadow-sm">
              <CreditCard size={18} className="text-purple-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{t('welcome.screen5.credit')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome.screen5.every15th')}</p>
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-50">$ 250.000</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600">{t('welcome.screen5.active')}</p>
              </div>
            </div>
          </div>
        </SlideAnimation>
      </div>

      {/* Info callout */}
      <SlideAnimation direction="up" delay={300}>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {t('welcome.screen5.reminderNote')}
          </p>
        </div>
      </SlideAnimation>

    </FullscreenLayout>
  );
}
