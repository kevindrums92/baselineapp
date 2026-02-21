/**
 * deleteAccount.service.ts
 * Service for deleting user accounts
 *
 * Calls the delete-account Edge Function to permanently delete:
 * - User authentication (auth.users)
 * - User state (transactions, categories, budgets, etc.)
 * - User subscriptions
 * - Push tokens
 * - Trusted devices
 *
 * Apple App Store Requirement:
 * - Required by Apple Guidelines for account management
 * - Users must be able to delete their account from within the app
 *
 * @see /supabase/functions/delete-account/index.ts
 */

import { supabase } from '@/lib/supabaseClient';
import { ENV } from '@/config/env';

/**
 * Result of account deletion operation
 */
export interface DeleteAccountResult {
  success: boolean;
  error: string | null;
}

/**
 * Deletes the current user's account permanently
 *
 * Process:
 * 1. Gets current session token for authentication
 * 2. Calls delete-account Edge Function
 * 3. Edge Function deletes all user data from database
 * 4. Edge Function deletes auth.users record (CASCADE deletes user_state)
 *
 * IMPORTANT: After successful deletion, the caller must:
 * - Sign out the user (call supabase.auth.signOut())
 * - Clear local state (call clearSubscription(), replaceAllData(), etc.)
 * - Navigate to login/onboarding screen
 *
 * @returns Promise with success status and error message (if any)
 *
 * @example
 * ```typescript
 * const { success, error } = await deleteAccount();
 *
 * if (success) {
 *   // Sign out and clean up
 *   await supabase.auth.signOut();
 *   clearSubscription();
 *   navigate('/');
 * } else {
 *   console.error('Failed to delete account:', error);
 * }
 * ```
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    console.log('[deleteAccount] Starting account deletion process...');

    // 1. Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('[deleteAccount] No active session:', sessionError);
      return {
        success: false,
        error: 'No active session. Please sign in again.',
      };
    }

    // 2. Call Edge Function with auth token
    const edgeFunctionUrl = `${ENV.supabase.url}/functions/v1/delete-account`;
    console.log('[deleteAccount] Calling Edge Function:', edgeFunctionUrl);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': ENV.supabase.anonKey,
      },
    });

    console.log('[deleteAccount] Edge Function response status:', response.status);

    // 3. Parse response
    const data = await response.json();

    if (!response.ok) {
      console.error('[deleteAccount] Edge Function error:', data);
      return {
        success: false,
        error: data.error || 'Failed to delete account. Please try again.',
      };
    }

    console.log('[deleteAccount] ✅ Account deleted successfully');

    return {
      success: true,
      error: null,
    };

  } catch (err: any) {
    console.error('[deleteAccount] Unexpected error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred. Please try again.',
    };
  }
}
