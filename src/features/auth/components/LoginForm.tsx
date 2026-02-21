/**
 * LoginForm Component
 * Login form with email/phone + password
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Lock, Loader2 } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';
import { useKeyboardDismiss } from '@/hooks/useKeyboardDismiss';
import PasswordInput from './PasswordInput';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function LoginForm({
  onSubmit,
  isLoading,
  error,
}: LoginFormProps) {
  const { t } = useTranslation('onboarding');
  const form = useAuthForm({ mode: 'login' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.canSubmit && !isLoading) {
      onSubmit(form.identifier, form.password);
    }
  };

  const IdentifierIcon = form.identifierType === 'email' ? Mail : Phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email/Phone Field */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <IdentifierIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('auth.fields.emailOrPhone', 'Correo o teléfono')}
            </label>
            <input
              type="text"
              value={form.identifier}
              onChange={(e) => form.setIdentifier(e.target.value)}
              placeholder={t('auth.placeholders.emailOrPhone', 'ejemplo@correo.com o +57...')}
              autoComplete="username"
              autoCapitalize="none"
              disabled={isLoading}
              className="w-full border-0 p-0 bg-transparent text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Password Field */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('auth.fields.password', 'Contraseña')}
            </label>
            <PasswordInput
              value={form.password}
              onChange={form.setPassword}
              placeholder={t('auth.placeholders.password', 'Tu contraseña')}
              showPassword={form.showPassword}
              onToggleVisibility={form.toggleShowPassword}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-[#18B7B0] hover:underline"
          onClick={() => setShowForgotPassword(true)}
        >
          {t('auth.forgotPassword.link', '¿Olvidaste tu contraseña?')}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!form.canSubmit || isLoading}
        className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          t('auth.buttons.login', 'Iniciar sesión')
        )}
      </button>

      {/* OTP info */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {t('auth.otpInfo', 'Se enviará un código de verificación para asegurar tu cuenta.')}
      </p>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </form>
  );
}
