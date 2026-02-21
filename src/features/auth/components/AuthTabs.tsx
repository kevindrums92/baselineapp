/**
 * AuthTabs Component
 * Login/Register tab switcher
 */

import { useTranslation } from 'react-i18next';

type AuthTab = 'login' | 'register';

interface AuthTabsProps {
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
}

export default function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div className="flex gap-2 px-6 py-3">
      <button
        type="button"
        onClick={() => onTabChange('login')}
        className={`
          flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200
          active:scale-[0.98]
          ${
            activeTab === 'login'
              ? 'bg-[#18B7B0] text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        {t('auth.tabs.login', 'Iniciar sesión')}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('register')}
        className={`
          flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200
          active:scale-[0.98]
          ${
            activeTab === 'register'
              ? 'bg-[#18B7B0] text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        {t('auth.tabs.register', 'Crear cuenta')}
      </button>
    </div>
  );
}
