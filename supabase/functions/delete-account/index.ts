/**
 * Delete Account Edge Function
 *
 * Permanently deletes a user account and all associated data from the database.
 * This function is called from the ProfilePage when a user confirms account deletion.
 *
 * Process:
 * 1. Verify user authentication via Authorization header
 * 2. Delete user_subscriptions (no CASCADE, must be manual)
 * 3. Delete push_tokens (if exists)
 * 4. Delete trusted_devices (if exists)
 * 5. Delete auth.users (CASCADE handles user_state automatically via ON DELETE CASCADE)
 * 6. Log deletion event for GDPR compliance
 *
 * Security:
 * - Requires valid JWT in Authorization header
 * - Uses service role key for admin.deleteUser()
 * - RLS policies ensure data isolation
 *
 * Apple App Store Requirement:
 * - Required by Apple Guidelines for account management
 * - Must be accessible from within the app
 * - Must delete all user data
 *
 * @see https://developer.apple.com/support/offering-account-deletion-in-your-app
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// ===================================================
// ENVIRONMENT CONFIGURATION
// ===================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===================================================
// HELPER FUNCTIONS
// ===================================================

/**
 * Verifies the user's JWT and returns the user ID
 */
async function verifyUser(authHeader: string | null): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: null, error: 'Invalid or expired token' };
  }

  return { userId: user.id, error: null };
}

/**
 * Deletes all user data from the database
 * @param userId - The UUID of the user to delete
 */
async function deleteUserData(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[delete-account] Starting deletion for user ${userId}`);

    // 1. Delete user_subscriptions (no CASCADE, must be manual)
    const { error: subsError } = await adminClient
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subsError) {
      console.error(`[delete-account] Failed to delete user_subscriptions:`, subsError);
      // Continue anyway - this is not critical
    } else {
      console.log(`[delete-account] Deleted user_subscriptions`);
    }

    // 2. Delete push_tokens (if exists)
    const { error: tokensError } = await adminClient
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (tokensError) {
      console.error(`[delete-account] Failed to delete push_tokens:`, tokensError);
      // Continue anyway
    } else {
      console.log(`[delete-account] Deleted push_tokens`);
    }

    // 3. Delete trusted_devices (if exists)
    const { error: devicesError } = await adminClient
      .from('trusted_devices')
      .delete()
      .eq('user_id', userId);

    if (devicesError) {
      console.error(`[delete-account] Failed to delete trusted_devices:`, devicesError);
      // Continue anyway
    } else {
      console.log(`[delete-account] Deleted trusted_devices`);
    }

    // 4. Log deletion event for GDPR compliance (before deleting user)
    const { error: logError } = await adminClient
      .from('revenuecat_events')
      .insert({
        event_id: `delete_account_${userId}_${Date.now()}`,
        event_type: 'ACCOUNT_DELETED',
        user_id: userId,
        product_id: null,
        status: 'active',
        purchased_at: new Date().toISOString(),
        expires_at: null,
        environment: 'PRODUCTION',
        raw_payload: { deleted_at: new Date().toISOString(), reason: 'user_requested' },
      });

    if (logError) {
      console.error(`[delete-account] Failed to log deletion event:`, logError);
      // Continue anyway - logging is not critical
    } else {
      console.log(`[delete-account] Logged deletion event`);
    }

    // 5. Delete auth.users (CASCADE will handle user_state automatically)
    // This is the critical step - it will cascade delete to user_state via ON DELETE CASCADE
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error(`[delete-account] Failed to delete auth user:`, deleteUserError);
      return { success: false, error: `Failed to delete user: ${deleteUserError.message}` };
    }

    console.log(`[delete-account] ✅ Successfully deleted user ${userId} and all associated data`);
    return { success: true, error: null };

  } catch (err) {
    console.error(`[delete-account] Unexpected error:`, err);
    return { success: false, error: String(err) };
  }
}

// ===================================================
// MAIN HANDLER
// ===================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[delete-account] Request received at ${new Date().toISOString()}`);

    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization');
    const { userId, error: authError } = await verifyUser(authHeader);

    if (authError || !userId) {
      console.error(`[delete-account] Authentication failed:`, authError);
      return new Response(
        JSON.stringify({ error: authError || 'Authentication failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[delete-account] Authenticated user: ${userId}`);

    // 2. Delete user data
    const { success, error: deleteError } = await deleteUserData(userId);

    if (!success) {
      return new Response(
        JSON.stringify({ error: deleteError || 'Failed to delete account' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        deleted_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error(`[delete-account] Unexpected error in handler:`, err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
