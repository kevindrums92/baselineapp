/**
 * Database Helpers for Edge Functions
 *
 * Provides typed access to Supabase database for notification-related queries.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type NotificationType =
  | 'daily_reminder'
  | 'daily_summary';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  device_info: {
    language?: string;
    platform?: string;
    isNative?: boolean;
    appVersion?: string;
    registeredAt?: string;
  };
  preferences: {
    scheduled_transactions: boolean;
    daily_reminder: { enabled: boolean; time: string };
    daily_summary: { enabled: boolean; time: string };
    quiet_hours: { enabled: boolean; start: string; end: string };
  };
  is_active: boolean;
}

export interface UserState {
  user_id: string;
  state: Record<string, unknown>;
}

/**
 * Create Supabase admin client (bypasses RLS)
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get active tokens for users who have a specific preference enabled
 */
export async function getActiveTokensWithPreference(
  supabase: SupabaseClient,
  preferenceKey: string,
  options?: { time?: string; timeKey?: 'daily_reminder' | 'daily_summary' }
): Promise<PushToken[]> {
  let query = supabase
    .from('push_tokens')
    .select('*')
    .eq('is_active', true);

  if (options?.timeKey) {
    // For time-based preferences (daily_reminder, daily_summary)
    query = query
      .eq(`preferences->${options.timeKey}->enabled`, true)
      .eq(`preferences->${options.timeKey}->time`, options.time);
  } else {
    // For boolean preferences
    query = query.eq(`preferences->${preferenceKey}`, true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Database] Error fetching tokens:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tokens by time preference (daily_reminder or daily_summary)
 */
export async function getTokensByTimePreference(
  supabase: SupabaseClient,
  preferenceKey: 'daily_reminder' | 'daily_summary',
  currentTime: string // Format: "HH:mm"
): Promise<PushToken[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('is_active', true)
    .eq(`preferences->${preferenceKey}->enabled`, true)
    .eq(`preferences->${preferenceKey}->time`, currentTime);

  if (error) {
    console.error('[Database] Error fetching tokens by time:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user state for a specific user
 */
export async function getUserState(
  supabase: SupabaseClient,
  userId: string
): Promise<UserState | null> {
  const { data, error } = await supabase
    .from('user_state')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[Database] Error fetching user state:', error);
    return null;
  }

  return data;
}

/**
 * Log notification to history
 */
export async function logNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    tokenId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    status: 'sent' | 'failed';
    errorMessage?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('notification_history').insert({
    user_id: params.userId,
    token_id: params.tokenId,
    notification_type: params.type,
    title: params.title,
    body: params.body,
    data: params.data || {},
    status: params.status,
    error_message: params.errorMessage,
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Database] Error logging notification:', error);
  }
}

/**
 * Deactivate a token (when FCM returns INVALID_TOKEN)
 */
export async function deactivateToken(
  supabase: SupabaseClient,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('token', token);

  if (error) {
    console.error('[Database] Error deactivating token:', error);
  }
}

/**
 * Check if user is in quiet hours
 */
export function isInQuietHours(preferences: PushToken['preferences']): boolean {
  if (!preferences.quiet_hours?.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { start, end } = preferences.quiet_hours;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  // Handle same-day quiet hours (e.g., 14:00 - 16:00)
  return currentTime >= start && currentTime < end;
}
