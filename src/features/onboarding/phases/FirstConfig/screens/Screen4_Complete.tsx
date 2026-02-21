/**
 * Screen4_Complete
 * Pantalla final de First Config: Todo listo
 */

import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { markOnboardingComplete } from '../../../utils/onboarding.helpers';
import { ONBOARDING_KEYS } from '../../../utils/onboarding.constants';
import { useOnboarding } from '../../../OnboardingContext';
import { useAppStore } from '@/state/app.store';
import { upsertCloudState } from '@/services/cloudState.service';
import { hasStoredSession } from '@/shared/utils/offlineSession';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';

export default function Screen4_Complete() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { state } = useOnboarding();

  const handleComplete = async () => {
    console.log('[ConfigScreen] Completing onboarding → App');

    // Push state to cloud if session exists (offline-safe check)
    // CloudSyncGate will retry later if this fails
    if (hasStoredSession()) {
      try {
        console.log('[ConfigScreen] Pushing state to cloud immediately');
        const getSnapshot = useAppStore.getState().getSnapshot;
        await upsertCloudState(getSnapshot());
        console.log('[ConfigScreen] State pushed to cloud successfully');
      } catch (err) {
        console.error('[ConfigScreen] Failed to push state to cloud:', err);
        // Continue anyway - CloudSyncGate will retry later
      }
    }

    // Set permanent device flag (ensures Welcome is skipped on future app resets)
    localStorage.setItem(ONBOARDING_KEYS.DEVICE_INITIALIZED, 'true');
    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={4} current={4} />}
      contentClassName="pb-8 md:pb-12 flex flex-col"
      ctaButton={
        <div>
          <button
            type="button"
            data-testid="complete-onboarding-button"
            onClick={handleComplete}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
          >
            <span>{t('complete.start')}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('complete.note')}
          </p>
        </div>
      }
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <Sparkles size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('complete.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('complete.subtitle')}
        </p>
      </div>

      {/* Configuration summary */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('complete.configTitle')}
        </h2>

        <div className="space-y-3">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.language')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.language === 'es' ? t('complete.languageEs') : t('complete.languageEn')}
            </span>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.theme')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.theme === 'light'
                ? t('complete.themeLight')
                : state.selections.theme === 'dark'
                ? t('complete.themeDark')
                : t('complete.themeSystem')}
            </span>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('complete.currency')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {state.selections.currency || 'COP'}
            </span>
          </div>
        </div>
      </div>

      {/* Features preview */}
      <div className="space-y-2 flex-1">
        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature1')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature1Desc')}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature2')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature2Desc')}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900 p-3.5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t('complete.feature3')}</p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {t('complete.feature3Desc')}
          </p>
        </div>
      </div>
    </FullscreenLayout>
  );
}
