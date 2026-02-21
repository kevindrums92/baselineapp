/**
 * BiometricPrompt Component
 *
 * Modal UI for biometric authentication prompt.
 * Displays custom UI with fade + scale animation.
 */

import { useState, useEffect } from 'react';
import { Fingerprint, AlertCircle } from 'lucide-react';
import { authenticateWithBiometrics, getBiometryDisplayName } from '../services/biometric.service';

type BiometricPromptProps = {
  open: boolean;
  onSuccess: () => void;
  onSkip: () => void;
  reason?: string;
  biometryType?: string;
};

export default function BiometricPrompt({
  open,
  onSuccess,
  onSkip,
  reason,
  biometryType = 'biometría',
}: BiometricPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animate in on mount
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setError(null);
      setIsAuthenticating(false);
    }
  }, [open]);

  // Lock body scroll when open
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

  if (!open) return null;

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    const result = await authenticateWithBiometrics(reason);

    if (result.success) {
      onSuccess();
    } else {
      // Handle errors
      if (result.errorCode === 'USER_CANCEL') {
        // User cancelled - just close, don't show error
        setIsAuthenticating(false);
      } else if (result.errorCode === 'LOCKOUT') {
        setError('Demasiados intentos. Intenta de nuevo más tarde.');
        setIsAuthenticating(false);
      } else if (result.errorCode === 'NOT_AVAILABLE') {
        setError('Autenticación biométrica no disponible.');
        setIsAuthenticating(false);
      } else {
        setError('Error al autenticar. Intenta de nuevo.');
        setIsAuthenticating(false);
      }
    }
  };

  const biometryDisplayName = getBiometryDisplayName(biometryType);

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isAuthenticating ? undefined : onSkip}
      />

      {/* Modal Card */}
      <div
        className={`relative mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl transform transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Icon Circle */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#18B7B0]/10">
            {error ? (
              <AlertCircle size={40} className="text-red-500" />
            ) : (
              <Fingerprint size={40} className="text-[#18B7B0]" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
          {error ? 'Error' : 'Autenticación requerida'}
        </h3>

        {/* Message */}
        <p className="mb-6 text-center text-sm text-gray-600">
          {error || reason || `Usa ${biometryDisplayName} para desbloquear BaselineApp`}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!error ? (
            <>
              <button
                type="button"
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-colors hover:bg-[#0d9488] disabled:bg-gray-300"
              >
                {isAuthenticating ? 'Autenticando...' : 'Autenticar'}
              </button>
              <button
                type="button"
                onClick={onSkip}
                disabled={isAuthenticating}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Usar Contraseña
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAuthenticate}
                className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white transition-colors hover:bg-[#0d9488]"
              >
                Intentar de nuevo
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Usar Contraseña
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
