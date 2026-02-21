/**
 * RegisterForm Component
 * Registration form with name + email/phone + password + terms
 */

import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Lock, Loader2, Check } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';
import { useKeyboardDismiss } from '@/hooks/useKeyboardDismiss';
import PasswordInput from './PasswordInput';

interface RegisterFormProps {
  onSubmit: (identifier: string, password: string, name: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function RegisterForm({
  onSubmit,
  isLoading,
  error,
}: RegisterFormProps) {
  const { t } = useTranslation('onboarding');
  const form = useAuthForm({ mode: 'register' });

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.canSubmit && !isLoading) {
      onSubmit(form.identifier, form.password, form.name);
    }
  };

  const IdentifierIcon = form.identifierType === 'email' ? Mail : Phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('auth.fields.name', 'Nombre')}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              placeholder={t('auth.placeholders.name', 'Tu nombre')}
              autoComplete="name"
              disabled={isLoading}
              className="w-full border-0 p-0 bg-transparent text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

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
              placeholder={t('auth.placeholders.passwordCreate', 'Crea una contraseña')}
              showPassword={form.showPassword}
              onToggleVisibility={form.toggleShowPassword}
              showStrength
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start gap-3 px-1">
        <button
          type="button"
          onClick={() => form.setTermsAccepted(!form.termsAccepted)}
          disabled={isLoading}
          className={`
            mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
            ${
              form.termsAccepted
                ? 'border-[#18B7B0] bg-[#18B7B0]'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
            }
            ${isLoading ? 'opacity-50' : ''}
          `}
          aria-checked={form.termsAccepted}
          role="checkbox"
        >
          {form.termsAccepted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.terms.prefix', 'Al crear una cuenta, aceptas nuestros ')}{' '}
          <button
            type="button"
            className="font-medium text-[#18B7B0] hover:underline"
            onClick={() => {
              // TODO: Open terms modal/page
              console.log('Open terms');
            }}
          >
            {t('auth.terms.termsLink', 'Términos de Servicio')}
          </button>{' '}
          {t('auth.terms.and', 'y')}{' '}
          <button
            type="button"
            className="font-medium text-[#18B7B0] hover:underline"
            onClick={() => {
              // TODO: Open privacy modal/page
              console.log('Open privacy');
            }}
          >
            {t('auth.terms.privacyLink', 'Política de Privacidad')}
          </button>
          .
        </p>
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
          t('auth.buttons.register', 'Crear cuenta')
        )}
      </button>

      {/* OTP info */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {t('auth.otpInfo', 'Se enviará un código de verificación para asegurar tu cuenta.')}
      </p>
    </form>
  );
}
