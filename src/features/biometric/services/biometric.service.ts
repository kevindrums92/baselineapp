/**
 * Biometric Authentication Service
 *
 * Platform abstraction layer for biometric authentication (Face ID, Touch ID, Fingerprint)
 * using @capgo/capacitor-native-biometric plugin.
 */

import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export type BiometricAvailability = {
  isAvailable: boolean;
  biometryType: 'none' | 'touchId' | 'faceId' | 'fingerprint' | 'faceAuthentication';
  reason?: string;
};

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
  errorCode?: 'USER_CANCEL' | 'LOCKOUT' | 'NOT_AVAILABLE' | 'UNKNOWN';
};

/**
 * Check if biometric authentication is available on this device
 * and if biometrics are enrolled (e.g., Face ID or fingerprint registered)
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  // Only available on native platforms
  if (!isNative()) {
    console.log('[Biometric] Not available: web platform');
    return {
      isAvailable: false,
      biometryType: 'none',
      reason: 'Web platform does not support biometric authentication',
    };
  }

  try {
    console.log('[Biometric] Starting availability check...');

    const result = await NativeBiometric.isAvailable();

    console.log('[Biometric] Availability check result:', JSON.stringify(result));

    if (!result.isAvailable) {
      return {
        isAvailable: false,
        biometryType: 'none',
        reason: 'Biometric authentication not available',
      };
    }

    // Map the biometry type from plugin to our type
    let biometryType: BiometricAvailability['biometryType'] = 'none';

    if (result.biometryType === BiometryType.TOUCH_ID) {
      biometryType = 'touchId';
    } else if (result.biometryType === BiometryType.FACE_ID) {
      biometryType = 'faceId';
    } else if (result.biometryType === BiometryType.FINGERPRINT) {
      biometryType = 'fingerprint';
    } else if (result.biometryType === BiometryType.FACE_AUTHENTICATION) {
      biometryType = 'faceAuthentication';
    } else if (result.biometryType === BiometryType.IRIS_AUTHENTICATION) {
      biometryType = 'fingerprint'; // Fallback for iris
    } else if (result.biometryType === BiometryType.MULTIPLE) {
      biometryType = 'fingerprint'; // Fallback for multiple
    }

    console.log('[Biometric] Mapped biometry type:', biometryType);

    return {
      isAvailable: true,
      biometryType,
    };
  } catch (error: any) {
    console.error('[Biometric] Error checking availability:', error?.message || String(error));
    return {
      isAvailable: false,
      biometryType: 'none',
      reason: error?.message || 'Error checking biometric availability',
    };
  }
}

/**
 * Authenticate user with biometrics
 *
 * @param reason - Optional reason to show in the biometric prompt (iOS)
 * @returns Result indicating success or failure with error details
 */
export async function authenticateWithBiometrics(
  reason?: string
): Promise<BiometricAuthResult> {
  if (!isNative()) {
    console.log('[Biometric] Cannot authenticate: web platform');
    return {
      success: false,
      error: 'Biometric authentication not available on web',
      errorCode: 'NOT_AVAILABLE',
    };
  }

  try {
    console.log('[Biometric] Attempting authentication...');

    // Perform authentication using verifyIdentity
    await NativeBiometric.verifyIdentity({
      reason: reason || 'Desbloquear BaselineApp',
      title: 'Autenticación Biométrica',
      subtitle: 'Verifica tu identidad',
      description: reason || 'Usa Face ID o Touch ID para continuar',
      negativeButtonText: 'Cancelar',
      maxAttempts: 3,
      useFallback: true, // Enable passcode fallback when biometrics fail
    });

    // If we reach here, authentication was successful
    console.log('[Biometric] Authentication successful');
    return { success: true };
  } catch (error: any) {
    console.error('[Biometric] Authentication error:', error);

    // Parse error code based on the plugin's error codes
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code;
    let resultErrorCode: BiometricAuthResult['errorCode'] = 'UNKNOWN';

    // Error codes from @capgo/capacitor-native-biometric:
    // 10 = Authentication failed
    // 13 = User pressed negative/cancel button
    // 16 = User cancelled
    // 1 = Biometrics unavailable
    // 3 = Biometrics not enrolled
    // 7 = Lockout
    if (errorCode === 13 || errorCode === 16 || errorMessage.includes('cancel') || errorMessage.includes('Cancel')) {
      resultErrorCode = 'USER_CANCEL';
    } else if (errorCode === 7 || errorMessage.includes('lockout') || errorMessage.includes('Lockout')) {
      resultErrorCode = 'LOCKOUT';
    } else if (errorCode === 1 || errorCode === 3 || errorMessage.includes('not available') || errorMessage.includes('not enrolled')) {
      resultErrorCode = 'NOT_AVAILABLE';
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: resultErrorCode,
    };
  }
}

/**
 * Get display name for biometry type
 *
 * @param type - Biometry type from checkBiometricAvailability
 * @returns Human-readable name in Spanish
 */
export function getBiometryDisplayName(type: string): string {
  switch (type) {
    case 'faceId':
      return 'Face ID';
    case 'touchId':
      return 'Touch ID';
    case 'fingerprint':
    case 'fingerprintAuthentication':
      return 'Huella Digital';
    case 'faceAuthentication':
      return 'Reconocimiento Facial';
    default:
      return 'Biometría';
  }
}

/**
 * Check if running on native platform (iOS or Android)
 */
function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
