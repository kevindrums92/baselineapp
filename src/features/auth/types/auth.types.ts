/**
 * Authentication Types
 * TypeScript interfaces for auth module
 */

// Authentication identifier type (email or phone)
export type AuthIdentifier = 'email' | 'phone';

// Auth form state for login/register
export interface AuthFormState {
  identifier: string;
  identifierType: AuthIdentifier;
  password: string;
  name?: string;
  termsAccepted?: boolean;
}

// Validation result for forms
export interface ValidationResult {
  isValid: boolean;
  errors: {
    identifier?: string;
    password?: string;
    name?: string;
    terms?: string;
  };
}

// Password validation breakdown
export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

// OTP verification state
export interface OTPState {
  digits: string[];
  isVerifying: boolean;
  error: string | null;
  resendCooldown: number;
  canResend: boolean;
}

// Trusted device info from database
export interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  last_used_at: string;
  created_at: string;
  expires_at: string;
}

// Auth operation result
export interface AuthResult {
  success: boolean;
  needsOTP: boolean;
  error?: string;
  errorCode?: AuthErrorCode;
  userId?: string;
}

// Auth error codes for handling
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'PHONE_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

// OTP verification type
export type OTPType = 'email' | 'sms';

// OTP purpose (for Supabase verifyOtp type parameter)
export type OTPPurpose = 'signup' | 'recovery' | 'email_change' | 'phone_change';

// Device info for fingerprinting
export interface DeviceInfo {
  fingerprint: string;
  name: string;
  browser: string;
  os: string;
}

// Auth session data passed between pages
export interface AuthSessionData {
  identifier: string;
  identifierType: AuthIdentifier;
  isNewUser: boolean;
  userId?: string;
  otpPurpose?: 'signup' | 'signin'; // Purpose of OTP verification
}
