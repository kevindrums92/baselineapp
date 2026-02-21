/**
 * Hook for Push Notifications
 *
 * Provides easy access to push notification functionality in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initializePushNotifications,
  requestPermissions,
  checkPermissionStatus,
  getPreferences,
  updatePreferences,
  isPushAvailable,
  isPushEnabled,
  addNotificationListener,
} from '@/services/pushNotification.service';
import type { NotificationPreferences } from '@/types/notifications';

interface UsePushNotificationsResult {
  /** Whether push notifications are available on this platform */
  isAvailable: boolean;
  /** Whether push notifications are fully enabled (permission + token) */
  isEnabled: boolean;
  /** Current permission status */
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'loading';
  /** Current notification preferences */
  preferences: NotificationPreferences | null;
  /** Whether preferences are loading */
  isLoading: boolean;
  /** Request push notification permissions */
  requestPermission: () => Promise<boolean>;
  /** Update notification preferences (must pass FULL preferences object) */
  updatePrefs: (prefs: NotificationPreferences) => Promise<boolean>;
  /** Refresh preferences from server */
  refreshPreferences: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [isAvailable] = useState(isPushAvailable);
  const [isEnabled, setIsEnabled] = useState(isPushEnabled);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'loading'
  >('loading');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      if (!isAvailable) {
        setPermissionStatus('denied');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user manually disabled push notifications
        const manuallyDisabled = localStorage.getItem('push_notifications_manually_disabled') === 'true';

        if (manuallyDisabled) {
          // User disabled manually - show as not configured (prompt state)
          console.log('[usePushNotifications] Manually disabled - showing as prompt');
          setPermissionStatus('prompt');
          setIsLoading(false);
          return;
        }

        // Check permission status
        const status = await checkPermissionStatus();
        setPermissionStatus(status);

        // Initialize if permission already granted
        if (status === 'granted') {
          await initializePushNotifications();
          setIsEnabled(isPushEnabled());

          // Load preferences
          const prefs = await getPreferences();
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('[usePushNotifications] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    // Cleanup on unmount
    return () => {
      // Don't cleanup here - service should persist across component unmounts
    };
  }, [isAvailable]);

  // Listen for notifications
  useEffect(() => {
    if (!isAvailable || !isEnabled) return;

    const removeListener = addNotificationListener((notification) => {
      console.log('[usePushNotifications] Notification received:', notification);
      // Could emit to a global state or show toast here
    });

    return removeListener;
  }, [isAvailable, isEnabled]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;

    try {
      setIsLoading(true);
      const granted = await requestPermissions();

      if (granted) {
        setPermissionStatus('granted');
        setIsEnabled(true);

        // Load preferences from backend (will be DEFAULT_NOTIFICATION_PREFERENCES for first-time)
        const prefs = await getPreferences();
        setPreferences(prefs);
      } else {
        setPermissionStatus('denied');
      }

      return granted;
    } catch (error) {
      console.error('[usePushNotifications] Request permission error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  const updatePrefs = useCallback(
    async (newPrefs: NotificationPreferences): Promise<boolean> => {
      try {
        const success = await updatePreferences(newPrefs);

        if (success) {
          // Update local state with the full preferences (no merge needed)
          setPreferences(newPrefs);
        }

        return success;
      } catch (error) {
        console.error('[usePushNotifications] Update preferences error:', error);
        return false;
      }
    },
    []
  );

  const refreshPreferences = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const prefs = await getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('[usePushNotifications] Refresh preferences error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAvailable,
    isEnabled,
    permissionStatus,
    preferences,
    isLoading,
    requestPermission,
    updatePrefs,
    refreshPreferences,
  };
}
