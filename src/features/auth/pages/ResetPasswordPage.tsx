/**
 * ResetPasswordPage
 * Página para ingresar nueva contraseña después de seguir el link de reset
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, CheckCircle2, Lock } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { updatePassword } from '../services/auth.service';
import { validatePassword } from '../services/validation.service';

export default function ResetPasswordPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = validation.isValid && passwordsMatch && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    const result = await updatePassword(password);

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      // Redirigir al home después de 2s (mantener sesión activa)
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } else {
      setError(result.error || 'Error al actualizar la contraseña');
    }
  };

  // Success state
  if (success) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.resetPassword.success', '¡Contraseña actualizada!')}
        </h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.resetPassword.redirecting', 'Redirigiendo...')}
        </p>
      </div>
    );
  }

  // Form
  return (
    <div
      className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full w-2/3 bg-[#18B7B0] transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-6 pt-12 pb-32">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
          <KeyRound className="h-10 w-10 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('auth.resetPassword.title', 'Nueva contraseña')}
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.resetPassword.message', 'Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres')}
        </p>

        {/* Form fields */}
        <div className="w-full max-w-sm space-y-4">
          {/* Password Input */}
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
                  value={password}
                  onChange={setPassword}
                  placeholder={t('auth.placeholders.passwordCreate', 'Crea una contraseña')}
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  showStrength
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('auth.resetPassword.confirmPassword', 'Confirmar contraseña')}
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder={t('auth.resetPassword.confirmPassword', 'Confirmar contraseña')}
                  showPassword={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                  showStrength={false}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Passwords don't match error */}
          {confirmPassword && !passwordsMatch && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <p className="text-sm text-red-700 dark:text-red-300">
                {t('auth.resetPassword.passwordsDontMatch', 'Las contraseñas no coinciden')}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-950 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t('auth.resetPassword.button', 'Actualizar contraseña')
          )}
        </button>
      </div>
    </div>
  );
}
