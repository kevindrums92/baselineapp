/**
 * LanguageSettingsPage
 * Página completa para seleccionar idioma
 */

import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/shared/components/layout/PageHeader';

export default function LanguageSettingsPage() {
  const { t } = useTranslation('profile');
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageSelect = async (code: string) => {
    await changeLanguage(code);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('preferences.language.label')} />

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-20">
        <div className="space-y-2">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSelect(lang.code)}
                className={`flex w-full items-center justify-between rounded-xl p-4 shadow-sm transition-colors ${
                  isSelected
                    ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{lang.flag}</div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</p>
                  </div>
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
