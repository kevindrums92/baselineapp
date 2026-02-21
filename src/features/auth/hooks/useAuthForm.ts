/**
 * useAuthForm Hook
 * Shared form state management for login/register
 */

import { useState, useMemo, useCallback } from 'react';
import type { AuthIdentifier, PasswordValidation } from '../types/auth.types';
import {
  detectIdentifierType,
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
} from '../services/validation.service';

interface UseAuthFormOptions {
  mode: 'login' | 'register';
}

interface UseAuthFormReturn {
  // Field values
  identifier: string;
  setIdentifier: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;

  // Password visibility
  showPassword: boolean;
  toggleShowPassword: () => void;

  // Derived state
  identifierType: AuthIdentifier;
  passwordValidation: PasswordValidation;

  // Validation state
  isIdentifierValid: boolean;
  isPasswordValid: boolean;
  isNameValid: boolean;
  canSubmit: boolean;

  // Actions
  reset: () => void;
}

export function useAuthForm({ mode }: UseAuthFormOptions): UseAuthFormReturn {
  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Detect identifier type (email or phone)
  const identifierType = useMemo(
    () => detectIdentifierType(identifier),
    [identifier]
  );

  // Validate identifier
  const isIdentifierValid = useMemo(() => {
    if (!identifier.trim()) return false;

    if (identifierType === 'email') {
      return validateEmail(identifier);
    }
    return validatePhone(identifier).isValid;
  }, [identifier, identifierType]);

  // Validate password
  const passwordValidation = useMemo(
    () => validatePassword(password),
    [password]
  );

  const isPasswordValid = passwordValidation.isValid;

  // Validate name (only for register)
  const isNameValid = useMemo(() => {
    if (mode === 'login') return true;
    return validateName(name);
  }, [mode, name]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    const baseValid = isIdentifierValid && isPasswordValid;

    if (mode === 'login') {
      return baseValid;
    }

    // Register mode
    return baseValid && isNameValid && termsAccepted;
  }, [mode, isIdentifierValid, isPasswordValid, isNameValid, termsAccepted]);

  // Toggle password visibility
  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Reset all fields
  const reset = useCallback(() => {
    setIdentifier('');
    setPassword('');
    setName('');
    setTermsAccepted(false);
    setShowPassword(false);
  }, []);

  return {
    // Field values
    identifier,
    setIdentifier,
    password,
    setPassword,
    name,
    setName,
    termsAccepted,
    setTermsAccepted,

    // Password visibility
    showPassword,
    toggleShowPassword,

    // Derived state
    identifierType,
    passwordValidation,

    // Validation state
    isIdentifierValid,
    isPasswordValid,
    isNameValid,
    canSubmit,

    // Actions
    reset,
  };
}
