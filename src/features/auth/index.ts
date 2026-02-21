/**
 * Auth Module
 * Public exports for authentication feature
 */

// Types
export type {
  AuthIdentifier,
  AuthFormState,
  ValidationResult,
  PasswordValidation,
  OTPState,
  TrustedDevice,
  AuthResult,
  AuthErrorCode,
  OTPType,
  DeviceInfo,
  AuthSessionData,
} from './types/auth.types';

// Services
export {
  signUpWithEmail,
  signUpWithPhone,
  signInWithEmail,
  signInWithPhone,
  verifyOTP,
  verifyPasswordResetOTP,
  resendOTP,
  getCurrentUser,
  getCurrentSession,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from './services/auth.service';

export {
  detectIdentifierType,
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  getPasswordStrength,
  getPasswordStrengthLabel,
  normalizeEmail,
  maskEmail,
  maskPhone,
} from './services/validation.service';

export {
  getDeviceFingerprint,
  getDeviceInfo,
  checkDeviceTrusted,
  trustDevice,
  removeTrustedDevice,
  getUserTrustedDevices,
  removeAllTrustedDevices,
} from './services/device.service';

// Hooks
export { useAuthForm } from './hooks/useAuthForm';
export { useLogin } from './hooks/useLogin';
export { useRegister } from './hooks/useRegister';
export { useOTPVerification } from './hooks/useOTPVerification';

// Components
export { default as OTPInput } from './components/OTPInput';
export { default as PasswordInput } from './components/PasswordInput';
export { default as AuthTabs } from './components/AuthTabs';
export { default as LoginForm } from './components/LoginForm';
export { default as RegisterForm } from './components/RegisterForm';
export { default as TrustDevicePrompt } from './components/TrustDevicePrompt';

// Pages
export { default as AuthPage } from './pages/AuthPage';
export { default as OTPVerificationPage } from './pages/OTPVerificationPage';
export { default as ResetPasswordOTPPage } from './pages/ResetPasswordOTPPage';
export { default as ResetPasswordPage } from './pages/ResetPasswordPage';
