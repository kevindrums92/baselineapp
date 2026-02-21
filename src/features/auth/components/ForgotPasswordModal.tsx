/**
 * ForgotPasswordModal
 * Modal para solicitar recuperación de contraseña
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2 } from 'lucide-react';
import { useKeyboardDismiss } from '@/hooks/useKeyboardDismiss';
import { sendPasswordResetEmail } from '../services/auth.service';
import { validateEmail } from '../services/validation.service';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);

    // Validar email
    if (!validateEmail(email)) {
      setError(t('auth.errors.invalidEmail', 'Email inválido'));
      return;
    }

    setIsLoading(true);

    const result = await sendPasswordResetEmail(email);

    setIsLoading(false);

    if (result.success) {
      // Close modal and navigate to OTP verification
      onClose();
      navigate('/onboarding/reset-password/verify', {
        state: { email },
      });
    } else {
      setError(result.error || 'Error al enviar el código');
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#18B7B0]/10 mx-auto">
          <Mail className="h-6 w-6 text-[#18B7B0]" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50 text-center">
          {t('auth.forgotPassword.title', 'Recuperar contraseña')}
        </h3>

        {/* Message */}
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          {t('auth.forgotPassword.message', 'Ingresa tu email y te enviaremos un código para restablecer tu contraseña')}
        </p>

        {/* Email Input */}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.fields.emailOrPhone', 'Correo o teléfono')}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20"
            disabled={isLoading}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {t('auth.forgotPassword.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!email || isLoading}
            className="flex-1 rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white hover:bg-[#16a5a0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              t('auth.forgotPassword.send', 'Enviar código')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
