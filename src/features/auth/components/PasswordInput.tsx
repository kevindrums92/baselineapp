/**
 * PasswordInput Component
 * Password field with visibility toggle and optional strength indicator
 */

import { useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, getPasswordStrengthLabel } from '../services/validation.service';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  showStrength?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Contraseña',
  showPassword,
  onToggleVisibility,
  showStrength = false,
  error,
  disabled = false,
}: PasswordInputProps) {
  const validation = useMemo(() => validatePassword(value), [value]);
  const strengthLabel = useMemo(
    () => getPasswordStrengthLabel(validation),
    [validation]
  );

  // Calculate strength score (0-3)
  const strengthScore = useMemo(() => {
    let score = 0;
    if (validation.minLength) score++;
    if (validation.hasUppercase) score++;
    if (validation.hasNumber) score++;
    return score;
  }, [validation]);

  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border-0 p-0 pr-10 bg-transparent text-base
            text-gray-900 dark:text-gray-50
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-0
            ${error ? 'text-red-600 dark:text-red-400' : ''}
            ${disabled ? 'opacity-50' : ''}
          `}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Strength indicator */}
      {showStrength && value.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {/* Strength bars */}
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  strengthScore >= level
                    ? strengthScore === 3
                      ? 'bg-emerald-500'
                      : strengthScore === 2
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Strength label */}
          <p
            className={`text-xs font-medium ${
              strengthScore === 3
                ? 'text-emerald-600 dark:text-emerald-400'
                : strengthScore === 2
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {strengthLabel}
          </p>

          {/* Requirements checklist */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span
              className={
                validation.minLength
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500'
              }
            >
              {validation.minLength ? '✓' : '○'} 8+ caracteres
            </span>
            <span
              className={
                validation.hasUppercase
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500'
              }
            >
              {validation.hasUppercase ? '✓' : '○'} Mayúscula
            </span>
            <span
              className={
                validation.hasNumber
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500'
              }
            >
              {validation.hasNumber ? '✓' : '○'} Número
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
