import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { updateTokenLanguage } from '@/services/pushNotification.service';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    locale: 'es-CO',
    flag: '🇨🇴'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-US',
    flag: '🇺🇸'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    locale: 'pt-BR',
    flag: '🇧🇷'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    locale: 'fr-FR',
    flag: '🇫🇷'
  },
];

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language || 'es';

  const currentLanguageData = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === currentLanguage
  ) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = useCallback(
    async (langCode: string) => {
      try {
        await i18n.changeLanguage(langCode);
        localStorage.setItem('app_language', langCode);
        // Sync language to push_tokens so Edge Functions can localize notifications
        updateTokenLanguage(langCode).catch(() => {});
        console.log('[i18n] Language changed to:', langCode);
      } catch (error) {
        console.error('[i18n] Error changing language:', error);
      }
    },
    [i18n]
  );

  const getLocale = useCallback(() => {
    return currentLanguageData.locale;
  }, [currentLanguageData]);

  return {
    currentLanguage,
    currentLanguageData,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    getLocale,
  };
}
