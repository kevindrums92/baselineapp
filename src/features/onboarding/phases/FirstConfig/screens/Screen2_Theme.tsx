/**
 * Screen2_Theme
 * Pantalla 2 de First Config: Selección de tema
 * Aplica el tema inmediatamente cuando el usuario lo selecciona
 */

import { Palette, Sun, Moon, Smartphone, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../../OnboardingContext';
import { useTheme, type Theme } from '@/features/theme';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';

type ThemeOption = 'light' | 'dark' | 'system';

export default function Screen2_Theme() {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { state, setTheme: setOnboardingTheme } = useOnboarding();
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();
  const [selected, setSelected] = useState<ThemeOption>(
    (state.selections.theme as ThemeOption) || currentTheme || 'system'
  );

  // Apply theme immediately when selection changes
  useEffect(() => {
    applyTheme(selected as Theme);
  }, [selected, applyTheme]);

  const THEME_OPTIONS: Array<{
    value: ThemeOption;
    icon: typeof Sun;
    title: string;
    description: string;
  }> = [
    {
      value: 'light',
      icon: Sun,
      title: t('theme.light.title'),
      description: t('theme.light.description'),
    },
    {
      value: 'dark',
      icon: Moon,
      title: t('theme.dark.title'),
      description: t('theme.dark.description'),
    },
    {
      value: 'system',
      icon: Smartphone,
      title: t('theme.system.title'),
      description: t('theme.system.description'),
    },
  ];

  const handleContinue = () => {
    setOnboardingTheme(selected);
    navigate('/onboarding/config/3', { replace: true });
  };

  const handleSkip = () => {
    // Omitir toda la configuración → ir directo a pantalla final (Screen5_Complete)
    navigate('/onboarding/config/4', { replace: true });
  };

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={4} current={2} />}
      headerRight={
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('theme.skip')}
        </button>
      }
      contentClassName="pb-8 md:pb-12"
      ctaButton={
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          {t('theme.continue')}
        </button>
      }
      className="transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Palette size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('theme.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-300">
          {t('theme.description')}
        </p>
      </div>

      {/* Theme options */}
      <div className="space-y-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={`flex w-full items-center gap-4 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-all active:scale-[0.98] ${
                isSelected ? 'ring-2 ring-[#18B7B0]' : 'ring-1 ring-gray-200 dark:ring-gray-700'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isSelected ? 'bg-[#18B7B0]' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                  strokeWidth={2.5}
                />
              </div>

              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {option.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B7B0]">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </FullscreenLayout>
  );
}
