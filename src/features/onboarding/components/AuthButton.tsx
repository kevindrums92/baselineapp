/**
 * AuthButton
 * Botón para opciones de autenticación (Google, Guest, Apple, Email)
 */

import type { LucideIcon } from 'lucide-react';
import type { AuthMethod } from '../utils/onboarding.types';

interface AuthButtonProps {
  provider: AuthMethod;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  label?: string;
}

const AUTH_BUTTON_STYLES: Record<
  AuthMethod,
  {
    label: string;
    bgColor: string;
    textColor: string;
    hoverColor: string;
    icon?: string;
  }
> = {
  google: {
    label: 'Continuar con Google',
    bgColor: 'bg-white',
    textColor: 'text-gray-900',
    hoverColor: 'hover:bg-gray-50',
    icon: '🌐', // Google icon placeholder
  },
  guest: {
    label: 'Explorar como invitado',
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    hoverColor: 'hover:bg-gray-800',
  },
  apple: {
    label: 'Continuar con Apple',
    bgColor: 'bg-black',
    textColor: 'text-white',
    hoverColor: 'hover:bg-gray-900',
    icon: '', // Apple icon
  },
  email: {
    label: 'Usuario y contraseña',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-blue-600',
  },
};

export default function AuthButton({
  provider,
  onClick,
  loading = false,
  disabled = false,
  fullWidth = true,
  icon: CustomIcon,
  label,
}: AuthButtonProps) {
  const style = AUTH_BUTTON_STYLES[provider];
  const buttonLabel = label || style.label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-3 rounded-2xl py-4 px-6
        text-base font-semibold shadow-sm
        transition-all active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-50
        ${style.bgColor} ${style.textColor} ${style.hoverColor}
        ${fullWidth ? 'w-full' : ''}
        ${provider === 'google' ? 'border border-gray-200' : ''}
      `}
    >
      {loading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {CustomIcon && <CustomIcon size={20} strokeWidth={2.5} />}
          {style.icon && !CustomIcon && <span className="text-xl">{style.icon}</span>}
          <span>{buttonLabel}</span>
        </>
      )}
    </button>
  );
}
