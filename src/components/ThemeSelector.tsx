/**
 * ThemeSelector
 * Modal selector para cambiar el tema de la aplicación
 */

import { useEffect, useState } from 'react';
import { Sun, Moon, Smartphone, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '@/features/theme';

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: Array<{
  value: Theme;
  icon: typeof Sun;
  titleKey: string;
}> = [
  { value: 'light', icon: Sun, titleKey: 'preferences.theme.light' },
  { value: 'dark', icon: Moon, titleKey: 'preferences.theme.dark' },
  { value: 'system', icon: Smartphone, titleKey: 'preferences.theme.system' },
];

export default function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { t } = useTranslation('profile');
  const { theme, setTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!isVisible) return null;

  const handleThemeSelect = (value: Theme) => {
    setTheme(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transform transition-all duration-200 ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t('preferences.theme.label')}
        </h3>

        {/* Theme options */}
        <div className="space-y-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleThemeSelect(option.value)}
                className={`flex w-full items-center justify-between rounded-xl p-3 transition-colors ${
                  isSelected
                    ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
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

        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {t('preferences.language.cancel', 'Cancelar')}
        </button>
      </div>
    </div>
  );
}
