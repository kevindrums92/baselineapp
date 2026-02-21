/**
 * Push Notification Service
 *
 * Handles push notification registration, token management, and preferences
 * for iOS and Android native platforms using Firebase Cloud Messaging.
 */

import { FirebaseMessaging, type NotificationActionPerformedEvent } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabaseClient';
import { isNative, getPlatform } from '@/shared/utils/platform';
import type { NotificationPreferences, Platform } from '@/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications';

type NotificationListener = (notification: unknown) => void;
type TokenListener = (token: string) => void;

interface PushNotificationServiceState {
  token: string | null;
  isInitialized: boolean;
  permissionGranted: boolean;
}

const state: PushNotificationServiceState = {
  token: null,
  isInitialized: false,
  permissionGranted: false,
};

const listeners: {
  notification: NotificationListener[];
  token: TokenListener[];
  cleanup: Array<() => void>;
} = {
  notification: [],
  token: [],
  cleanup: [],
};

// Debounce timer for tokenReceived events (Firebase can fire multiple in quick succession)
let tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the push notification service
 * Only works on native platforms (iOS/Android)
 */
export async function initializePushNotifications(): Promise<boolean> {
  if (!isNative()) {
    console.log('[PushNotification] Skipping - not a native platform');
    return false;
  }

  if (state.isInitialized) {
    console.log('[PushNotification] Already initialized');
    return state.permissionGranted;
  }

  try {
    // Check current permission status
    const permissionStatus = await FirebaseMessaging.checkPermissions();
    console.log('[PushNotification] Permission status:', permissionStatus.receive);

    if (permissionStatus.receive === 'granted') {
      state.permissionGranted = true;
      await registerAndSaveToken();
      setupListeners();
      state.isInitialized = true;
      return true;
    }

    // Permission not yet granted - don't request automatically
    // Let the UI request when appropriate
    state.isInitialized = true;
    return false;
  } catch (error) {
    console.error('[PushNotification] Initialization failed:', error);
    return false;
  }
}

/**
 * Request push notification permissions from the user
 * Call this from UI when user explicitly enables notifications
 */
export async function requestPermissions(): Promise<boolean> {
  if (!isNative()) {
    console.log('[PushNotification] Skipping permission request - not native');
    return false;
  }

  try {
    const result = await FirebaseMessaging.requestPermissions();
    state.permissionGranted = result.receive === 'granted';

    console.log('[PushNotification] Permission result:', result.receive);

    if (state.permissionGranted) {
      // Clear manual disable flag when user re-enables
      localStorage.removeItem('push_notifications_manually_disabled');

      // First-time registration: use isRefresh=false to apply DEFAULT_NOTIFICATION_PREFERENCES
      await registerAndSaveToken(false);
      setupListeners();
    }

    return state.permissionGranted;
  } catch (error) {
    console.error('[PushNotification] Permission request failed:', error);
    return false;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isNative()) {
    return 'denied';
  }

  try {
    const result = await FirebaseMessaging.checkPermissions();
    return result.receive as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    console.error('[PushNotification] Check permission failed:', error);
    return 'denied';
  }
}

/**
 * Get the current FCM token
 */
export function getToken(): string | null {
  return state.token;
}

/**
 * Register device and get FCM token
 * @param isRefresh - If true, preserves existing preferences (token refresh).
 *                    If false, applies DEFAULT_NOTIFICATION_PREFERENCES (first-time registration).
 */
async function registerAndSaveToken(isRefresh = true): Promise<void> {
  try {
    const result = await FirebaseMessaging.getToken();
    state.token = result.token;

    console.log('[PushNotification] FCM Token obtained');

    // Save token to Supabase
    await saveTokenToBackend(state.token, isRefresh);
  } catch (error) {
    console.error('[PushNotification] Failed to get token:', error);
  }
}

/**
 * Save FCM token to Supabase
 * Uses a SECURITY DEFINER function to bypass RLS and allow token takeover between users
 * Works for both authenticated users and guest users (user_id = null)
 *
 * @param token - FCM token
 * @param isRefresh - If true, only updates metadata without touching preferences
 */
async function saveTokenToBackend(token: string, isRefresh = false): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get user_id (null for guests)
    const userId = user?.id ?? null;

    const platform = getPlatform() as Platform;
    const deviceInfo = getDeviceInfo();

    if (isRefresh) {
      // Token refresh: only update metadata, preserve preferences
      const { data, error } = await supabase.rpc('refresh_push_token', {
        p_user_id: userId,
        p_token: token,
        p_platform: platform,
        p_device_info: deviceInfo,
      });

      if (error) {
        console.error('[PushNotification] Failed to refresh token:', error);
        return;
      }

      if (userId) {
        console.log('[PushNotification] Token refreshed (authenticated, preferences preserved):', data);
      } else {
        console.log('[PushNotification] Token refreshed (guest mode, preferences preserved):', data);
      }
    } else {
      // First-time registration: set default preferences
      const { data, error } = await supabase.rpc('upsert_push_token', {
        p_user_id: userId,
        p_token: token,
        p_platform: platform,
        p_device_info: deviceInfo,
        p_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      });

      if (error) {
        console.error('[PushNotification] Failed to save token:', error);
        return;
      }

      if (userId) {
        console.log('[PushNotification] Token saved (authenticated):', data);
      } else {
        console.log('[PushNotification] Token saved (guest mode):', data);
      }
    }
  } catch (error) {
    console.error('[PushNotification] saveTokenToBackend error:', error);
  }
}

/**
 * Setup Firebase Messaging listeners
 */
function setupListeners(): void {
  // Notification received (app in foreground)
  FirebaseMessaging.addListener('notificationReceived', (notification) => {
    console.log('[PushNotification] Notification received:', notification);
    listeners.notification.forEach((callback) => callback(notification));
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });

  // Notification action (user tapped notification)
  FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
    console.log('[PushNotification] Notification action:', action);
    handleNotificationTap(action);
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });

  // Token refreshed
  // IMPORTANT: Firebase can fire multiple tokenReceived events in quick succession
  // (e.g., APNS token + FCM token on iOS). We debounce to only process the final token.
  FirebaseMessaging.addListener('tokenReceived', (event) => {
    console.log('[PushNotification] tokenReceived event:', event.token.slice(-10));

    // Always update state.token to the latest received
    state.token = event.token;

    // Debounce: clear previous timer and wait for events to settle
    if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);

    tokenRefreshTimer = setTimeout(async () => {
      const finalToken = state.token;
      if (!finalToken) return;
      console.log('[PushNotification] Processing final token after debounce:', finalToken.slice(-10));
      await saveTokenToBackend(finalToken, true); // isRefresh = true → preserve preferences
      listeners.token.forEach((callback) => callback(finalToken));
    }, 1000);
  }).then((handle) => {
    listeners.cleanup.push(() => handle.remove());
  });
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
function handleNotificationTap(action: NotificationActionPerformedEvent): void {
  const data = action.notification?.data as Record<string, unknown> | undefined;

  if (!data?.type) {
    window.location.href = '/';
    return;
  }

  switch (data.type) {
    case 'daily_reminder':
      window.location.href = '/add';
      break;
    case 'upcoming_transaction_scheduled':
    case 'upcoming_transaction_pending':
    case 'upcoming_transactions_multiple': {
      try {
        sessionStorage.setItem('pending-upcoming-modal', String(data.type));
      } catch { /* ignore */ }
      window.dispatchEvent(
        new CustomEvent('show-upcoming-transactions', {
          detail: { type: data.type },
        })
      );
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      break;
    }
    case 'daily_summary':
      window.location.href = '/stats';
      break;
    default:
      window.location.href = '/';
  }
}

/**
 * Get notification preferences for current device
 * Works for both authenticated users and guests (queries by token)
 */
export async function getPreferences(): Promise<NotificationPreferences | null> {
  try {
    if (!state.token) {
      console.log('[PushNotification] No token available, cannot get preferences');
      return null;
    }

    // Query by token (works for both authenticated and guest users)
    const { data, error } = await supabase
      .from('push_tokens')
      .select('preferences')
      .eq('token', state.token)
      .maybeSingle();

    if (error) {
      console.error('[PushNotification] Failed to get preferences:', error);
      return null;
    }

    // If no token record exists yet (first time setup), return defaults
    if (!data) {
      console.log('[PushNotification] No preferences found, returning defaults');
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    return data.preferences as NotificationPreferences;
  } catch (error) {
    console.error('[PushNotification] getPreferences error:', error);
    return null;
  }
}

/**
 * Update notification preferences
 * Uses a SECURITY DEFINER function to bypass RLS and allow token takeover between users
 * Works for both authenticated users and guests
 *
 * IMPORTANT: Caller MUST pass the FULL preference state (all fields), not partial updates.
 * This avoids race conditions when multiple updates happen in parallel.
 */
export async function updatePreferences(
  preferences: NotificationPreferences
): Promise<boolean> {
  try {
    if (!state.token) {
      console.warn('[PushNotification] No token to update preferences');
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get user_id (null for guests)
    const userId = user?.id ?? null;

    const platform = getPlatform() as Platform;
    const deviceInfo = getDeviceInfo();

    // Use RPC to call SECURITY DEFINER function (bypasses RLS)
    // Use the full preferences object passed by the caller (no merge needed)
    console.log('[PushNotification] Calling upsert_push_token with preferences:', JSON.stringify(preferences));
    const { data, error } = await supabase.rpc('upsert_push_token', {
      p_user_id: userId,
      p_token: state.token,
      p_platform: platform,
      p_device_info: deviceInfo,
      p_preferences: preferences,
    });

    if (error) {
      console.error('[PushNotification] Failed to update preferences:', error);
      return false;
    }

    if (userId) {
      console.log('[PushNotification] Preferences updated (authenticated):', data);
    } else {
      console.log('[PushNotification] Preferences updated (guest mode):', data);
    }
    return true;
  } catch (error) {
    console.error('[PushNotification] updatePreferences error:', error);
    return false;
  }
}

/**
 * Migrate a guest token to an authenticated user when they log in
 * This preserves the push token and its preferences when transitioning from guest to authenticated
 */
export async function migrateGuestTokenToUser(): Promise<boolean> {
  try {
    if (!state.token) {
      console.log('[PushNotification] No token to migrate');
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[PushNotification] No user to migrate token to');
      return false;
    }

    const { data, error } = await supabase.rpc('migrate_guest_token_to_user', {
      p_user_id: user.id,
      p_token: state.token,
    });

    if (error) {
      console.error('[PushNotification] Failed to migrate guest token:', error);
      return false;
    }

    console.log('[PushNotification] Guest token migrated to user:', data);
    return true;
  } catch (error) {
    console.error('[PushNotification] migrateGuestTokenToUser error:', error);
    return false;
  }
}

/**
 * Deactivate current token (call on logout)
 */
export async function deactivateToken(): Promise<void> {
  try {
    if (!state.token) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('token', state.token)
      .eq('user_id', user.id);

    if (error) {
      console.error('[PushNotification] Failed to deactivate token:', error);
      return;
    }

    console.log('[PushNotification] Token deactivated');
  } catch (error) {
    console.error('[PushNotification] deactivateToken error:', error);
  }
}

/**
 * Update the language stored in device_info for the current token.
 * Call this when the user changes their language preference.
 */
export async function updateTokenLanguage(language: string): Promise<void> {
  try {
    if (!state.token) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Read current device_info, merge language
    const { data } = await supabase
      .from('push_tokens')
      .select('device_info')
      .eq('token', state.token)
      .eq('user_id', user.id)
      .single();

    const currentInfo = (data?.device_info as Record<string, unknown>) || {};
    const updatedInfo = { ...currentInfo, language };

    const { error } = await supabase
      .from('push_tokens')
      .update({ device_info: updatedInfo })
      .eq('token', state.token)
      .eq('user_id', user.id);

    if (error) {
      console.error('[PushNotification] Failed to update language:', error);
      return;
    }

    console.log('[PushNotification] Language updated to:', language);
  } catch (error) {
    console.error('[PushNotification] updateTokenLanguage error:', error);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationListener(callback: NotificationListener): () => void {
  listeners.notification.push(callback);
  return () => {
    const index = listeners.notification.indexOf(callback);
    if (index > -1) {
      listeners.notification.splice(index, 1);
    }
  };
}

/**
 * Add token refresh listener
 */
export function addTokenListener(callback: TokenListener): () => void {
  listeners.token.push(callback);
  return () => {
    const index = listeners.token.indexOf(callback);
    if (index > -1) {
      listeners.token.splice(index, 1);
    }
  };
}

/**
 * Cleanup all listeners (call on app unmount)
 */
export function cleanup(): void {
  listeners.cleanup.forEach((remove) => remove());
  listeners.cleanup = [];
  listeners.notification = [];
  listeners.token = [];
  state.isInitialized = false;
  console.log('[PushNotification] Cleaned up');
}

/**
 * Get device info for token registration
 */
function getDeviceInfo(): Record<string, unknown> {
  // Get IANA timezone (e.g., "America/Bogota")
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    language: localStorage.getItem('app_language') || 'es',
    timezone,
    registeredAt: new Date().toISOString(),
  };
}

/**
 * Check if push notifications are available on this platform
 */
export function isPushAvailable(): boolean {
  return isNative();
}

/**
 * Check if push notifications are fully enabled (permission + token)
 */
export function isPushEnabled(): boolean {
  return state.permissionGranted && state.token !== null;
}

/**
 * Completely disable push notifications and clean up all data
 * - Deletes token from Supabase
 * - Clears local storage (token, preferences, banner tracking)
 * - Resets service state
 * Returns true if successful, false otherwise
 */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    console.log('[PushNotification] Disabling push notifications...');

    // 1. Get current token
    const currentToken = state.token;

    // 2. Delete token from Supabase (works for both authenticated and guest users)
    if (currentToken) {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('token', currentToken);

      if (error) {
        console.error('[PushNotification] Failed to delete token from database:', error);
        return false;
      }

      console.log('[PushNotification] Token deleted from database');
    }

    // 3. Clear local storage
    localStorage.removeItem('fcm_token');
    localStorage.removeItem('push_preferences');
    localStorage.removeItem('app.pushBannerDismisses'); // Reset banner tracking

    // Set manual disable flag to prevent auto-initialization
    localStorage.setItem('push_notifications_manually_disabled', 'true');

    // 4. Reset service state
    state.token = null;
    state.permissionGranted = false;
    state.isInitialized = false;

    console.log('[PushNotification] Push notifications disabled successfully');
    return true;
  } catch (error) {
    console.error('[PushNotification] Failed to disable push notifications:', error);
    return false;
  }
}
