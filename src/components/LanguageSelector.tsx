/**
 * LanguageSelector
 * Modal selector para cambiar el idioma de la aplicación
 */

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ open, onClose }: LanguageSelectorProps) {
  const { t } = useTranslation('profile');
  const { languages, currentLanguage, changeLanguage } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [selected, setSelected] = useState(currentLanguage);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setSelected(currentLanguage);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, currentLanguage]);

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

  const handleLanguageSelect = async (code: string) => {
    setSelected(code);
    await changeLanguage(code);
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
          {t('preferences.language.label')}
        </h3>

        {/* Language options */}
        <div className="space-y-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageSelect(lang.code)}
              className={`flex w-full items-center justify-between rounded-xl p-3 transition-colors ${
                selected === lang.code
                  ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
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

              {selected === lang.code && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18B7B0]">
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
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
