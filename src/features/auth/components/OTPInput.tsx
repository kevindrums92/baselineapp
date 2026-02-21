/**
 * OTPInput Component
 * 6-digit OTP input with auto-advance
 */

import { useRef, useEffect, useCallback } from 'react';
import { useKeyboardDismiss } from '@/hooks/useKeyboardDismiss';

interface OTPInputProps {
  digits: string[];
  onDigitChange: (index: number, value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const OTP_LENGTH = 6;

export default function OTPInput({
  digits,
  onDigitChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle input change
  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only accept single digit
      const digit = value.replace(/[^0-9]/g, '').slice(-1);
      onDigitChange(index, digit);

      // Auto-advance to next input if digit entered
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [onDigitChange]
  );

  // Handle key down for backspace navigation
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          // If current is empty and backspace pressed, go to previous
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, OTP_LENGTH);

      // Fill all digits from pasted value
      pasted.split('').forEach((char, i) => {
        onDigitChange(i, char);
      });

      // Focus the input after the last pasted digit
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [onDigitChange]
  );

  // Handle focus - select all text in input
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const hasValue = digits[index]?.length === 1;

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            disabled={disabled}
            autoComplete="one-time-code"
            className={`
              h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold
              transition-all duration-200 focus:outline-none
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${
                error
                  ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400 animate-shake'
                  : hasValue
                  ? 'border-[#18B7B0] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
              }
              focus:border-[#18B7B0] focus:ring-2 focus:ring-[#18B7B0]/20
            `}
            aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
          />
        );
      })}
    </div>
  );
}
