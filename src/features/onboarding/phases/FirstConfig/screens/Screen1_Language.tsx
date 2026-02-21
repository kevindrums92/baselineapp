/**
 * Screen1_Language
 * Pantalla 1 de First Config: Selección de idioma con i18n integrado
 */

import { Languages, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnboarding } from '../../../OnboardingContext';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';

export default function Screen1_Language() {
  const navigate = useNavigate();
  const { t } = useTranslation(['onboarding', 'common']);
  const { languages, currentLanguage, changeLanguage } = useLanguage();
  const { state, setLanguage } = useOnboarding();

  const [selected, setSelected] = useState(state.selections.language || currentLanguage);

  const handleLanguageSelect = async (code: string) => {
    setSelected(code);
    // Cambio instantáneo de idioma en la UI
    await changeLanguage(code);
  };

  const handleContinue = () => {
    setLanguage(selected);
    navigate('/onboarding/config/2', { replace: true });
  };

  const handleSkip = () => {
    // Omitir toda la configuración → ir directo a pantalla final (Screen5_Complete)
    navigate('/onboarding/config/4', { replace: true });
  };

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={4} current={1} />}
      headerRight={
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('language.skip')}
        </button>
      }
      contentClassName="pb-8 md:pb-12"
      ctaButton={
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
        >
          {t('language.continue')}
        </button>
      }
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Languages size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('language.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t('language.description')}
        </p>
      </div>

      {/* Language options */}
      <div className="space-y-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLanguageSelect(lang.code)}
            className={`flex w-full items-center justify-between rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm transition-all active:scale-[0.98] ${
              selected === lang.code
                ? 'ring-2 ring-[#18B7B0]'
                : 'ring-1 ring-gray-200 dark:ring-gray-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{lang.flag}</div>
              <div className="text-left">
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {lang.nativeName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lang.name}</p>
              </div>
            </div>

            {selected === lang.code && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B7B0]">
                <Check className="h-5 w-5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </FullscreenLayout>
  );
}
