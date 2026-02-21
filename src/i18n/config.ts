import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import esCommon from './locales/es/common.json';
import esOnboarding from './locales/es/onboarding.json';
import esProfile from './locales/es/profile.json';
import esHome from './locales/es/home.json';
import esLegal from './locales/es/legal.json';
import esNotifications from './locales/es/notifications.json';
import esPaywall from './locales/es/paywall.json';
import esSession from './locales/es/session.json';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enProfile from './locales/en/profile.json';
import enHome from './locales/en/home.json';
import enLegal from './locales/en/legal.json';
import enNotifications from './locales/en/notifications.json';
import enPaywall from './locales/en/paywall.json';
import enSession from './locales/en/session.json';

import ptCommon from './locales/pt/common.json';
import ptOnboarding from './locales/pt/onboarding.json';
import ptProfile from './locales/pt/profile.json';
import ptHome from './locales/pt/home.json';
import ptLegal from './locales/pt/legal.json';
import ptNotifications from './locales/pt/notifications.json';
import ptPaywall from './locales/pt/paywall.json';
import ptSession from './locales/pt/session.json';

import frCommon from './locales/fr/common.json';
import frOnboarding from './locales/fr/onboarding.json';
import frProfile from './locales/fr/profile.json';
import frHome from './locales/fr/home.json';
import frLegal from './locales/fr/legal.json';
import frNotifications from './locales/fr/notifications.json';
import frPaywall from './locales/fr/paywall.json';
import frSession from './locales/fr/session.json';

const resources = {
  es: {
    common: esCommon,
    onboarding: esOnboarding,
    profile: esProfile,
    home: esHome,
    legal: esLegal,
    notifications: esNotifications,
    paywall: esPaywall,
    session: esSession,
  },
  en: {
    common: enCommon,
    onboarding: enOnboarding,
    profile: enProfile,
    home: enHome,
    legal: enLegal,
    notifications: enNotifications,
    paywall: enPaywall,
    session: enSession,
  },
  pt: {
    common: ptCommon,
    onboarding: ptOnboarding,
    profile: ptProfile,
    home: ptHome,
    legal: ptLegal,
    notifications: ptNotifications,
    paywall: ptPaywall,
    session: ptSession,
  },
  fr: {
    common: frCommon,
    onboarding: frOnboarding,
    profile: frProfile,
    home: frHome,
    legal: frLegal,
    notifications: frNotifications,
    paywall: frPaywall,
    session: frSession,
  },
};

// Custom language detector
const customDetector = {
  name: 'customDetector',
  lookup() {
    // 1. Check localStorage first
    const stored = localStorage.getItem('app_language');
    if (stored && ['es', 'en', 'pt', 'fr'].includes(stored)) {
      return stored;
    }

    // 2. Check navigator.language
    const browserLang = navigator.language.split('-')[0];
    if (['es', 'en', 'pt', 'fr'].includes(browserLang)) {
      return browserLang;
    }

    // 3. Fallback to Spanish
    return 'es';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('app_language', lng);
  },
};

i18n
  .use({
    type: 'languageDetector',
    detect: customDetector.lookup,
    cacheUserLanguage: customDetector.cacheUserLanguage,
  } as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'onboarding', 'profile', 'home', 'legal', 'notifications', 'paywall', 'session'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Disable suspense to avoid flicker
    },
    detection: {
      order: ['customDetector'],
      caches: ['localStorage'],
    },
  });

export default i18n;
