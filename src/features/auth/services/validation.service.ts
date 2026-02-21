/**
 * Validation Service
 * Email, phone, and password validation utilities
 */

import type { AuthIdentifier, PasswordValidation } from '../types/auth.types';

// Email regex (RFC-compliant basic pattern)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone detection: starts with + or has 10+ digits
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

// Phone with Colombian country code (used in validatePhone)
const _PHONE_WITH_CODE_REGEX = /^\+57[0-9]{10}$/;
void _PHONE_WITH_CODE_REGEX; // suppress unused warning, reserved for future use

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;

// Name requirements
const NAME_MIN_LENGTH = 2;
const NAME_REGEX = /^[\p{L}\s'-]+$/u; // Letters, spaces, hyphens, apostrophes

/**
 * Detect if value is email or phone
 */
export function detectIdentifierType(value: string): AuthIdentifier {
  const trimmed = value.trim();

  // If contains @ it's an email
  if (trimmed.includes('@')) {
    return 'email';
  }

  // If starts with + or is all digits, it's a phone
  if (trimmed.startsWith('+') || /^\d+$/.test(trimmed.replace(/[\s-]/g, ''))) {
    return 'phone';
  }

  // Default to email
  return 'email';
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Validate and normalize phone number
 * Returns normalized E.164 format for Colombia if valid
 */
export function validatePhone(phone: string): { isValid: boolean; normalized: string } {
  // Remove spaces, dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Already in international format
  if (cleaned.startsWith('+')) {
    const isValid = PHONE_REGEX.test(cleaned);
    return { isValid, normalized: cleaned };
  }

  // Colombian number without country code (10 digits starting with 3)
  if (/^3[0-9]{9}$/.test(cleaned)) {
    return { isValid: true, normalized: `+57${cleaned}` };
  }

  // Colombian number with leading 57 (no +)
  if (/^57[0-9]{10}$/.test(cleaned)) {
    return { isValid: true, normalized: `+${cleaned}` };
  }

  // Check general phone format
  const isValid = PHONE_REGEX.test(cleaned);
  return { isValid, normalized: cleaned.startsWith('+') ? cleaned : `+${cleaned}` };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidation {
  const minLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUppercase = HAS_UPPERCASE.test(password);
  const hasNumber = HAS_NUMBER.test(password);

  return {
    minLength,
    hasUppercase,
    hasNumber,
    isValid: minLength && hasUppercase && hasNumber,
  };
}

/**
 * Get password strength score (0-3)
 */
export function getPasswordStrength(validation: PasswordValidation): number {
  let score = 0;
  if (validation.minLength) score++;
  if (validation.hasUppercase) score++;
  if (validation.hasNumber) score++;
  return score;
}

/**
 * Get password strength label in Spanish
 */
export function getPasswordStrengthLabel(validation: PasswordValidation): string {
  const score = getPasswordStrength(validation);

  if (score === 0) return '';
  if (score === 1) return 'Contraseña débil';
  if (score === 2) return 'Contraseña moderada';
  return 'Contraseña fuerte';
}

/**
 * Validate full name
 */
export function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= NAME_MIN_LENGTH && NAME_REGEX.test(trimmed);
}

/**
 * Normalize email to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Mask email for display (show first 3 chars + domain)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const visible = local.slice(0, 3);
  const masked = '*'.repeat(Math.max(0, local.length - 3));
  return `${visible}${masked}@${domain}`;
}

/**
 * Mask phone for display (show last 4 digits)
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length < 4) return phone;

  const visible = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return `${masked}${visible}`;
}
