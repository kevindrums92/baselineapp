/**
 * TrustDevicePrompt Component
 * Modal asking if user wants to trust this device
 */

import { useTranslation } from 'react-i18next';
import { Smartphone, Shield } from 'lucide-react';

interface TrustDevicePromptProps {
  open: boolean;
  onTrust: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export default function TrustDevicePrompt({
  open,
  onTrust,
  onSkip,
  isLoading = false,
}: TrustDevicePromptProps) {
  const { t } = useTranslation('onboarding');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onSkip}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18B7B0]/10">
              <Smartphone className="h-8 w-8 text-[#18B7B0]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#18B7B0]">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t('auth.trustDevice.title', '¿Confiar en este dispositivo?')}
        </h3>

        {/* Message */}
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t(
            'auth.trustDevice.message',
            'No te pediremos el código de verificación en este dispositivo durante 90 días.'
          )}
        </p>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onTrust}
            disabled={isLoading}
            className="w-full rounded-xl bg-[#18B7B0] py-3 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {t('auth.trustDevice.trust', 'Sí, confiar en este dispositivo')}
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {t('auth.trustDevice.skip', 'No, gracias')}
          </button>
        </div>

        {/* Security note */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t(
            'auth.trustDevice.note',
            'Solo confía en dispositivos personales y seguros.'
          )}
        </p>
      </div>
    </div>
  );
}
