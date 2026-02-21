/**
 * Push Notifications Types
 */

export type NotificationType =
  | 'daily_reminder'
  | 'upcoming_transaction_scheduled'
  | 'upcoming_transaction_pending'
  | 'upcoming_transactions_multiple'
  | 'daily_summary';

export type NotificationStatus = 'sent' | 'delivered' | 'clicked' | 'failed';

export type Platform = 'ios' | 'android';

export interface DailyReminderPreference {
  enabled: boolean;
  time: string; // "HH:mm" format, e.g., "20:00"
}

export interface DailySummaryPreference {
  enabled: boolean;
  time: string; // "HH:mm" format, e.g., "20:00"
}

export interface QuietHoursPreference {
  enabled: boolean;
  start: string; // "HH:mm" format, e.g., "22:00"
  end: string; // "HH:mm" format, e.g., "08:00"
}

export interface NotificationPreferences {
  scheduled_transactions: boolean;
  daily_reminder: DailyReminderPreference;
  daily_summary: DailySummaryPreference;
  quiet_hours: QuietHoursPreference;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: Platform;
  device_info: Record<string, unknown>;
  preferences: NotificationPreferences;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string;
}

export interface NotificationHistoryEntry {
  id: string;
  user_id: string;
  token_id: string | null;
  notification_type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  clicked_at: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Convert local time to UTC time
 * @param localTime Time in HH:mm format (local timezone)
 * @returns Time in HH:mm format (UTC)
 */
function localToUTC(localTime: string): string {
  const [hours, minutes] = localTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();

  return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
}

/**
 * Default notification preferences
 * Applied when user first enables push notifications
 * Times are converted to UTC based on device timezone
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  scheduled_transactions: true,
  daily_reminder: {
    enabled: true,
    time: localToUTC('21:00'), // 9pm local time
  },
  daily_summary: {
    enabled: true,  // Enabled by default
    time: localToUTC('21:00'), // 9pm local time
  },
  quiet_hours: {
    enabled: true,
    start: localToUTC('23:00'), // 11pm local time
    end: localToUTC('06:00'),   // 6am local time
  },
};
