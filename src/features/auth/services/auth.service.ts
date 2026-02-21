/**
 * Auth Service
 * Supabase authentication operations
 */

import { supabase } from '@/lib/supabaseClient';
import type { AuthResult, AuthErrorCode, OTPType } from '../types/auth.types';
import { normalizeEmail, validatePhone } from './validation.service';

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  try {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('[AuthService] Sign up error:', error);
      return {
        success: false,
        needsOTP: false,
        error: mapSupabaseError(error.message),
        errorCode: mapErrorCode(error.message),
      };
    }

    // Check if user already exists (Supabase returns user with identities = [])
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        needsOTP: false,
        error: 'Ya existe una cuenta con este correo',
        errorCode: 'EMAIL_EXISTS',
      };
    }

    return {
      success: true,
      needsOTP: true,
      userId: data.user?.id,
    };
  } catch (error) {
    console.error('[AuthService] Sign up exception:', error);
    return {
      success: false,
      needsOTP: false,
      error: 'Error inesperado. Intenta de nuevo.',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Sign up with phone and password
 */
export async function signUpWithPhone(
  phone: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  try {
    const { normalized } = validatePhone(phone);

    const { data, error } = await supabase.auth.signUp({
      phone: normalized,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('[AuthService] Sign up error:', error);
      return {
        success: false,
        needsOTP: false,
        error: mapSupabaseError(error.message),
        errorCode: mapErrorCode(error.message),
      };
    }

    // Check if user already exists
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        needsOTP: false,
        error: 'Ya existe una cuenta con este teléfono',
        errorCode: 'PHONE_EXISTS',
      };
    }

    return {
      success: true,
      needsOTP: true,
      userId: data.user?.id,
    };
  } catch (error) {
    console.error('[AuthService] Sign up exception:', error);
    return {
      success: false,
      needsOTP: false,
      error: 'Error inesperado. Intenta de nuevo.',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error('[AuthService] Sign in error:', error);
      return {
        success: false,
        needsOTP: false,
        error: mapSupabaseError(error.message),
        errorCode: mapErrorCode(error.message),
      };
    }

    return {
      success: true,
      needsOTP: false, // Will be determined by device trust check
      userId: data.user?.id,
    };
  } catch (error) {
    console.error('[AuthService] Sign in exception:', error);
    return {
      success: false,
      needsOTP: false,
      error: 'Error inesperado. Intenta de nuevo.',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Sign in with phone and password
 */
export async function signInWithPhone(
  phone: string,
  password: string
): Promise<AuthResult> {
  try {
    const { normalized } = validatePhone(phone);

    const { data, error } = await supabase.auth.signInWithPassword({
      phone: normalized,
      password,
    });

    if (error) {
      console.error('[AuthService] Sign in error:', error);
      return {
        success: false,
        needsOTP: false,
        error: mapSupabaseError(error.message),
        errorCode: mapErrorCode(error.message),
      };
    }

    return {
      success: true,
      needsOTP: false,
      userId: data.user?.id,
    };
  } catch (error) {
    console.error('[AuthService] Sign in exception:', error);
    return {
      success: false,
      needsOTP: false,
      error: 'Error inesperado. Intenta de nuevo.',
      errorCode: 'UNKNOWN',
    };
  }
}

/**
 * Verify OTP code
 * For email signup confirmation, uses type 'signup'
 * For email 2FA/login, uses type 'email'
 * For phone SMS, uses type 'sms'
 */
export async function verifyOTP(
  identifier: string,
  token: string,
  type: OTPType,
  purpose: 'signup' | '2fa' = 'signup'
): Promise<{ success: boolean; error?: string }> {
  try {
    // For signup: use 'signup' type
    // For 2FA login: use 'email' type (magic link OTP)
    // For phone: use 'sms' type
    let verifyOptions;

    if (type === 'email') {
      const otpType = purpose === 'signup' ? 'signup' : 'email';
      verifyOptions = {
        email: normalizeEmail(identifier),
        type: otpType as any,
        token
      };
    } else {
      verifyOptions = {
        phone: validatePhone(identifier).normalized,
        type: 'sms' as any,
        token
      };
    }

    console.log('[AuthService] Verifying OTP with type:', type, 'purpose:', purpose);

    const { error } = await supabase.auth.verifyOtp(verifyOptions);

    if (error) {
      console.error('[AuthService] OTP verify error:', error);
      return {
        success: false,
        error: error.message.includes('expired')
          ? 'El código ha expirado'
          : 'Código incorrecto',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[AuthService] OTP verify exception:', error);
    return {
      success: false,
      error: 'Error al verificar el código',
    };
  }
}

/**
 * Send OTP for 2FA login verification
 * Called when device is not trusted after password login
 */
export async function send2FAOTP(
  identifier: string,
  type: 'email' | 'phone'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[AuthService] Sending 2FA OTP for:', type, identifier);

    const { error } = await supabase.auth.signInWithOtp({
      ...(type === 'email'
        ? { email: normalizeEmail(identifier) }
        : { phone: validatePhone(identifier).normalized }),
      options: {
        shouldCreateUser: false, // Don't create user, they already exist
      },
    });

    if (error) {
      console.error('[AuthService] 2FA OTP send error:', error);

      if (error.message.includes('rate') || error.message.includes('limit')) {
        return {
          success: false,
          error: 'Demasiados intentos. Espera un momento.',
        };
      }

      return {
        success: false,
        error: 'No se pudo enviar el código',
      };
    }

    console.log('[AuthService] 2FA OTP sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[AuthService] 2FA OTP send exception:', error);
    return {
      success: false,
      error: 'Error al enviar el código',
    };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(
  identifier: string,
  type: OTPType
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resend({
      ...(type === 'email'
        ? { email: normalizeEmail(identifier), type: 'signup' }
        : { phone: validatePhone(identifier).normalized, type: 'sms' }),
    });

    if (error) {
      console.error('[AuthService] Resend OTP error:', error);

      if (error.message.includes('rate') || error.message.includes('limit')) {
        return {
          success: false,
          error: 'Demasiados intentos. Espera un momento.',
        };
      }

      return {
        success: false,
        error: 'No se pudo reenviar el código',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[AuthService] Resend OTP exception:', error);
    return {
      success: false,
      error: 'Error al reenviar el código',
    };
  }
}

/**
 * Check if user exists by email
 */
export async function checkUserExistsByEmail(): Promise<boolean> {
  // Note: This is a limited approach. Supabase doesn't provide a direct "user exists" check.
  // We attempt sign-in and check for specific error messages.
  // A better approach would be an Edge Function or database query.

  // For now, we'll let the sign-up handle duplicate detection
  return false;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Sign out
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

/**
 * Send password reset OTP
 * Sends a 6-digit OTP to the user's email for password reset
 * @param email Email address
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = normalizeEmail(email);

    // Use signInWithOtp to send OTP for password reset
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false, // Don't create user if doesn't exist
      },
    });

    if (error) {
      console.error('[AuthService] Password reset OTP error:', error);

      // Check if it's a rate limiting error
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('security purposes') || errorMessage.includes('after')) {
        // Extract seconds from error message like "you can only request this after 39 seconds"
        const match = errorMessage.match(/(\d+)\s*second/);
        const seconds = match ? match[1] : '60';
        return {
          success: false,
          error: `Debes esperar ${seconds} segundos antes de solicitar otro código`,
        };
      }

      // For other errors, return generic success for security (don't reveal if email exists)
      return {
        success: true, // Always return success to prevent email enumeration
      };
    }

    console.log('[AuthService] Password reset OTP sent to:', normalizedEmail);
    return { success: true };
  } catch (err) {
    console.error('[AuthService] Password reset unexpected error:', err);
    return {
      success: false,
      error: 'Error al enviar el código. Intenta de nuevo.',
    };
  }
}

/**
 * Verify OTP for password reset
 * Uses 'email' type instead of 'signup' for password recovery flow
 * @param email Email address
 * @param token 6-digit OTP code
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function verifyPasswordResetOTP(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = normalizeEmail(email);

    console.log('[AuthService] Verifying password reset OTP for:', normalizedEmail);

    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email', // Use 'email' type for password reset (not 'signup')
    });

    if (error) {
      console.error('[AuthService] Password reset OTP verify error:', error);
      return {
        success: false,
        error: error.message.includes('expired')
          ? 'El código ha expirado. Solicita uno nuevo.'
          : 'Código incorrecto',
      };
    }

    console.log('[AuthService] Password reset OTP verified successfully');
    return { success: true };
  } catch (err) {
    console.error('[AuthService] Password reset OTP verify exception:', err);
    return {
      success: false,
      error: 'Error al verificar el código. Intenta de nuevo.',
    };
  }
}

/**
 * Update password for authenticated user
 * Called after following password reset link
 * @param newPassword New password
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[AuthService] Update password error:', error);
      return {
        success: false,
        error: mapSupabaseError(error.message),
      };
    }

    console.log('[AuthService] Password updated successfully');
    return { success: true };
  } catch (err) {
    console.error('[AuthService] Update password unexpected error:', err);
    return {
      success: false,
      error: 'Error al actualizar la contraseña. Intenta de nuevo.',
    };
  }
}

/**
 * Map Supabase error messages to Spanish
 */
function mapSupabaseError(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Correo/teléfono o contraseña incorrectos';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'Debes verificar tu correo primero';
  }
  if (lowerMessage.includes('user not found')) {
    return 'No encontramos una cuenta con estos datos';
  }
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'Ya existe una cuenta con este correo/teléfono';
  }
  if (lowerMessage.includes('weak password') || lowerMessage.includes('password')) {
    return 'La contraseña no cumple los requisitos';
  }
  if (lowerMessage.includes('rate') || lowerMessage.includes('limit')) {
    return 'Demasiados intentos. Espera un momento.';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Error de conexión. Verifica tu internet.';
  }

  return 'Error inesperado. Intenta de nuevo.';
}

/**
 * Map Supabase error to error code
 */
function mapErrorCode(message: string): AuthErrorCode {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) return 'INVALID_CREDENTIALS';
  if (lowerMessage.includes('user not found')) return 'USER_NOT_FOUND';
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return lowerMessage.includes('email') ? 'EMAIL_EXISTS' : 'PHONE_EXISTS';
  }
  if (lowerMessage.includes('weak password') || lowerMessage.includes('password')) return 'WEAK_PASSWORD';
  if (lowerMessage.includes('rate') || lowerMessage.includes('limit')) return 'RATE_LIMIT';
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) return 'NETWORK_ERROR';

  return 'UNKNOWN';
}
