/**
 * Environment configuration
 *
 * Access environment variables and detect current environment.
 */

import { Capacitor } from '@capacitor/core';

export const ENV = {
  // Current environment name
  name: import.meta.env.VITE_ENV || 'development',

  // Environment checks
  isDev: import.meta.env.VITE_ENV === 'development',
  isProd: import.meta.env.VITE_ENV === 'production',

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // RevenueCat configuration
  revenuecat: {
    iosApiKey: import.meta.env.VITE_REVENUECAT_IOS_API_KEY_PROD || '',
    androidApiKey: import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY_PROD || '',
  },
};

/**
 * Get OAuth redirect URL for deep linking
 *
 * Returns the correct URL scheme based on environment:
 * - DEV: baselineapp-dev://auth/callback
 * - PROD: baselineapp://auth/callback
 *
 * This ensures OAuth callbacks open the correct app instance.
 */
export function getOAuthRedirectUrl(): string {
  return ENV.isDev ? 'baselineapp-dev://auth/callback' : 'baselineapp://auth/callback';
}

/**
 * Get RevenueCat API key based on platform
 *
 * Returns the correct API key for:
 * - iOS: appl_xxxxxxxxxxxxxxxx
 * - Android: goog_xxxxxxxxxxxxxxxx
 *
 * Returns empty string for web (uses mock).
 *
 * Note: Only production keys are stored. For testing, manually swap the keys in .env.local.
 */
export function getRevenueCatApiKey(): string {
  const platform = Capacitor.getPlatform();

  // Web uses mock, no API key needed
  if (platform === 'web') {
    return '';
  }

  // Get API key based on platform
  if (platform === 'ios') {
    return ENV.revenuecat.iosApiKey;
  }

  if (platform === 'android') {
    return ENV.revenuecat.androidApiKey;
  }

  // Unknown platform
  console.warn(`[ENV] Unknown platform: ${platform}, using mock RevenueCat`);
  return '';
}

// Log environment on startup (development only)
if (ENV.isDev) {
  console.log(
    `%c🏷️ Running in ${ENV.name.toUpperCase()} mode`,
    'background: #0d9488; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log(`📡 Supabase: ${ENV.supabase.url}`);
  console.log(`🔗 OAuth redirect: ${getOAuthRedirectUrl()}`);

  const rcApiKey = getRevenueCatApiKey();
  if (rcApiKey) {
    console.log(`💰 RevenueCat: Configured (${Capacitor.getPlatform()})`);
  } else {
    console.log(`💰 RevenueCat: Using mock (web or missing API key)`);
  }
}
