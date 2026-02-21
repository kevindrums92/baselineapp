/**
 * ThemeSettingsPage
 * Página completa para seleccionar tema
 */

import { Sun, Moon, Smartphone, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '@/features/theme';
import PageHeader from '@/shared/components/layout/PageHeader';

const THEME_OPTIONS: Array<{
  value: Theme;
  icon: typeof Sun;
  titleKey: string;
}> = [
  { value: 'light', icon: Sun, titleKey: 'preferences.theme.light' },
  { value: 'dark', icon: Moon, titleKey: 'preferences.theme.dark' },
  { value: 'system', icon: Smartphone, titleKey: 'preferences.theme.system' },
];

export default function ThemeSettingsPage() {
  const { t } = useTranslation('profile');
  const { theme, setTheme } = useTheme();

  const handleThemeSelect = (value: Theme) => {
    setTheme(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('preferences.theme.label')} />

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-20">
        <div className="space-y-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleThemeSelect(option.value)}
                className={`flex w-full items-center justify-between rounded-xl p-4 shadow-sm transition-colors ${
                  isSelected
                    ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-[#18B7B0]' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {t(option.titleKey)}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18B7B0]">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
