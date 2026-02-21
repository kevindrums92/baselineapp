/**
 * Screen5_Notifications
 * Pantalla 5 de First Config: Activar notificaciones push
 * Solo se muestra en plataformas nativas (iOS/Android).
 * En web, auto-skip al siguiente paso.
 * Ahora soporta push notifications para usuarios invitados (guest mode).
 */

import { Bell, Calendar, Clock, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isNative } from '@/shared/utils/platform';
import { requestPermissions } from '@/services/pushNotification.service';

const NEXT_STEP = '/onboarding/config/6';

export default function Screen5_Notifications() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const [isRequesting, setIsRequesting] = useState(false);

  // Auto-skip only for web (not for native guest users)
  useEffect(() => {
    if (!isNative()) {
      navigate(NEXT_STEP, { replace: true });
    }
  }, [navigate]);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      // requestPermissions() now automatically applies DEFAULT_NOTIFICATION_PREFERENCES
      await requestPermissions();
    } catch (err) {
      console.error('[PushOnboarding] Error:', err);
    } finally {
      setIsRequesting(false);
      navigate(NEXT_STEP, { replace: true });
    }
  };

  const handleSkip = () => {
    navigate(NEXT_STEP, { replace: true });
  };

  const features = [
    {
      icon: Calendar,
      title: t('pushOnboarding.feature1Title'),
      desc: t('pushOnboarding.feature1Desc'),
    },
    {
      icon: Clock,
      title: t('pushOnboarding.feature2Title'),
      desc: t('pushOnboarding.feature2Desc'),
    },
    {
      icon: BarChart3,
      title: t('pushOnboarding.feature3Title'),
      desc: t('pushOnboarding.feature3Desc'),
    },
  ];

  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Progress - 5 of 6 */}
      <div className="flex gap-1.5 px-6 pt-3">
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Bell size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('pushOnboarding.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-300">
          {t('pushOnboarding.description')}
        </p>
      </div>

      {/* Feature cards */}
      <div className="flex-1 px-6">
        <div className="space-y-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18B7B0]/10">
                  <Icon className="h-5 w-5 text-[#18B7B0]" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleEnable}
            disabled={isRequesting}
            className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isRequesting
              ? t('pushOnboarding.enabling')
              : t('pushOnboarding.enable')}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isRequesting}
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
          >
            {t('pushOnboarding.skip')}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {t('pushOnboarding.skipNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
