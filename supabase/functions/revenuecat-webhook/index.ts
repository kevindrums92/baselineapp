/**
 * RevenueCat Webhook Handler
 *
 * Receives webhook events from RevenueCat and updates user subscriptions in Supabase.
 * This Edge Function is the ONLY place that writes to the `user_subscriptions` table.
 *
 * Supported events:
 * - INITIAL_PURCHASE: User started subscription or trial
 * - NON_RENEWING_PURCHASE: User purchased non-renewable product (e.g., lifetime)
 * - RENEWAL: Subscription renewed at billing date
 * - CANCELLATION: User unsubscribed
 * - EXPIRATION: Subscription expired
 * - UNCANCELLATION: User reactivated cancelled subscription
 * - PRODUCT_CHANGE: User switched plans
 * - BILLING_ISSUE: Payment failed
 * - TRIAL_STARTED: Trial began
 * - TRIAL_CANCELLED: Trial cancelled before expiration
 *
 * Security:
 * - Verifies Authorization header with secret token
 * - Uses service role key for database access
 * - Implements idempotency via event_id tracking
 *
 * Setup:
 * 1. Set REVENUECAT_WEBHOOK_SECRET in Supabase secrets
 * 2. Configure webhook in RevenueCat dashboard with this URL
 * 3. Add Authorization header in RevenueCat webhook config
 *
 * @see https://www.revenuecat.com/docs/integrations/webhooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// ===================================================
// ENVIRONMENT CONFIGURATION
// ===================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // Service role for bypassing RLS
const revenuecatSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===================================================
// TYPE DEFINITIONS
// ===================================================

interface RevenueCatWebhookPayload {
  event: {
    type: string;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    app_id: string;
    event_timestamp_ms: number;
    product_id: string;
    entitlement_id: string | null; // Singular field (some events use this)
    entitlement_ids: string[] | null; // Plural field (some events use this)
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    period_type: string;
    currency: string | null;
    price: number | null;
    store: string;
    environment: string;
    is_family_share: boolean | null;
    country_code: string;
    transaction_id: string | null;
    original_transaction_id: string | null;
    subscriber_attributes?: Record<string, any>;
  };
  api_version: string;
}

interface UserSubscription {
  id?: string;
  user_id: string;
  product_id: string;
  entitlement_ids: string[];
  original_transaction_id: string | null;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  period_type: 'trial' | 'normal';
  purchased_at: string;
  expires_at: string | null;
  environment: 'PRODUCTION' | 'SANDBOX';
  billing_issue_detected_at?: string | null;
  last_event_id: string;
  updated_at: string;
}

// ===================================================
// WEBHOOK VERIFICATION
// ===================================================

/**
 * Verifies the Authorization header sent by RevenueCat
 *
 * RevenueCat sends: Authorization: Bearer YOUR_SECRET_TOKEN
 * We compare the token with our REVENUECAT_WEBHOOK_SECRET
 */
function verifyWebhookAuthorization(
  authHeader: string | null
): { valid: boolean; error?: string } {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  if (!revenuecatSecret) {
    console.error('[WEBHOOK] REVENUECAT_WEBHOOK_SECRET not configured');
    return { valid: false, error: 'Server configuration error' };
  }

  // Extract token from "Bearer TOKEN" format
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (token !== revenuecatSecret) {
    return { valid: false, error: 'Invalid authorization token' };
  }

  return { valid: true };
}

// ===================================================
// EVENT HANDLERS
// ===================================================

/**
 * Handles INITIAL_PURCHASE and TRIAL_STARTED events
 * Creates or updates subscription record with active/trial status
 */
async function handleInitialPurchase(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    purchased_at_ms,
    expiration_at_ms,
    period_type,
    transaction_id,
    environment,
  } = event;

  // Validate required fields
  if (!app_user_id || !product_id) {
    throw new Error('Missing required fields: app_user_id or product_id');
  }

  // Determine subscription status
  const isTrialPeriod = period_type === 'TRIAL';
  const status: UserSubscription['status'] = isTrialPeriod ? 'trial' : 'active';

  console.log(`[INITIAL_PURCHASE] User: ${app_user_id}, Product: ${product_id}, Status: ${status}`);

  // Normalize entitlements (handle both singular and plural fields, and null values)
  const normalizedEntitlements =
    entitlement_ids ?? // Use plural if available
    (entitlement_id ? [entitlement_id] : null) ?? // Convert singular to array
    ['pro']; // Default fallback

  // Upsert subscription record
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id,
    entitlement_ids: normalizedEntitlements,
    original_transaction_id: transaction_id ?? null,
    status,
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    purchased_at: new Date(purchased_at_ms).toISOString(),
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[INITIAL_PURCHASE] Database error:', error);
    throw new Error(`Failed to save subscription: ${error.message}`);
  }

  console.log('[INITIAL_PURCHASE] Subscription saved:', data.id);
  return data;
}

/**
 * Handles RENEWAL events
 * Updates subscription with new expiration date and sets status to active
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleRenewal(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[RENEWAL] User: ${app_user_id}, Product: ${product_id}`);

  // Normalize entitlements (handle both singular and plural fields, and null values)
  const normalizedEntitlements =
    entitlement_ids ?? // Use plural if available
    (entitlement_id ? [entitlement_id] : null) ?? // Convert singular to array
    ['pro']; // Default fallback

  // Use upsert instead of update to handle missed INITIAL_PURCHASE events
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id,
    entitlement_ids: normalizedEntitlements,
    status: 'active',
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    billing_issue_detected_at: null, // Clear billing issues on successful renewal
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[RENEWAL] Database error:', error);
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  console.log('[RENEWAL] Subscription renewed:', data.id);
  return data;
}

/**
 * Handles CANCELLATION and TRIAL_CANCELLED events
 * Marks subscription as cancelled
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleCancellation(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[CANCELLATION] User: ${app_user_id}`);

  // Normalize entitlements
  const normalizedEntitlements =
    entitlement_ids ??
    (entitlement_id ? [entitlement_id] : null) ??
    ['pro'];

  // Use upsert to handle missed INITIAL_PURCHASE
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id: product_id ?? 'unknown',
    entitlement_ids: normalizedEntitlements,
    status: 'cancelled',
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[CANCELLATION] Database error:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  console.log('[CANCELLATION] Subscription cancelled:', data.id);
  return data;
}

/**
 * Handles EXPIRATION events
 * Marks subscription as expired
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleExpiration(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[EXPIRATION] User: ${app_user_id}`);

  // Normalize entitlements
  const normalizedEntitlements =
    entitlement_ids ??
    (entitlement_id ? [entitlement_id] : null) ??
    ['pro'];

  // Use upsert to handle missed INITIAL_PURCHASE
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id: product_id ?? 'unknown',
    entitlement_ids: normalizedEntitlements,
    status: 'expired',
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms
      ? new Date(expiration_at_ms).toISOString()
      : new Date().toISOString(),
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[EXPIRATION] Database error:', error);
    throw new Error(`Failed to expire subscription: ${error.message}`);
  }

  console.log('[EXPIRATION] Subscription expired:', data.id);
  return data;
}

/**
 * Handles UNCANCELLATION events
 * Restores a cancelled subscription to active/trial status
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleUncancellation(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[UNCANCELLATION] User: ${app_user_id}, Product: ${product_id}`);

  const isTrialPeriod = period_type === 'TRIAL';
  const status: UserSubscription['status'] = isTrialPeriod ? 'trial' : 'active';

  // Normalize entitlements
  const normalizedEntitlements =
    entitlement_ids ??
    (entitlement_id ? [entitlement_id] : null) ??
    ['pro'];

  // Use upsert to handle missed INITIAL_PURCHASE
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id: product_id ?? 'unknown',
    entitlement_ids: normalizedEntitlements,
    status,
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    billing_issue_detected_at: null,
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[UNCANCELLATION] Database error:', error);
    throw new Error(`Failed to restore subscription: ${error.message}`);
  }

  console.log('[UNCANCELLATION] Subscription restored:', data.id);
  return data;
}

/**
 * Handles PRODUCT_CHANGE events
 * Updates subscription when user switches plans (e.g., monthly → annual)
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleProductChange(
  event: RevenueCatWebhookPayload['event']
): Promise<UserSubscription> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[PRODUCT_CHANGE] User: ${app_user_id}, New Product: ${product_id}`);

  // Normalize entitlements
  const normalizedEntitlements =
    entitlement_ids ??
    (entitlement_id ? [entitlement_id] : null) ??
    ['pro'];

  // Use upsert to handle missed INITIAL_PURCHASE
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id: product_id ?? 'unknown',
    entitlement_ids: normalizedEntitlements,
    status: 'active',
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[PRODUCT_CHANGE] Database error:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  console.log('[PRODUCT_CHANGE] Product updated:', data.id);
  return data;
}

/**
 * Handles BILLING_ISSUE events
 * Records billing issue timestamp but keeps subscription active (grace period)
 * Uses upsert to handle cases where INITIAL_PURCHASE was missed
 */
async function handleBillingIssue(
  event: RevenueCatWebhookPayload['event']
): Promise<void> {
  const {
    app_user_id,
    product_id,
    entitlement_id,
    entitlement_ids,
    expiration_at_ms,
    period_type,
    transaction_id,
    purchased_at_ms,
    environment,
  } = event;

  console.log(`[BILLING_ISSUE] User: ${app_user_id}`);

  // Normalize entitlements
  const normalizedEntitlements =
    entitlement_ids ??
    (entitlement_id ? [entitlement_id] : null) ??
    ['pro'];

  // Use upsert to handle missed INITIAL_PURCHASE
  const subscriptionData: Omit<UserSubscription, 'id'> = {
    user_id: app_user_id,
    product_id: product_id ?? 'unknown',
    entitlement_ids: normalizedEntitlements,
    status: 'active', // Keep active during grace period
    period_type: (period_type?.toLowerCase() as 'trial' | 'normal') || 'normal',
    expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    original_transaction_id: transaction_id ?? null,
    purchased_at: purchased_at_ms ? new Date(purchased_at_ms).toISOString() : new Date().toISOString(),
    environment: environment as 'PRODUCTION' | 'SANDBOX',
    billing_issue_detected_at: new Date().toISOString(),
    last_event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });

  if (error) {
    console.error('[BILLING_ISSUE] Database error:', error);
    throw new Error(`Failed to record billing issue: ${error.message}`);
  }

  console.log('[BILLING_ISSUE] Billing issue recorded for user:', app_user_id);
}

// ===================================================
// MAIN WEBHOOK HANDLER
// ===================================================

/**
 * Routes webhook events to appropriate handlers
 * Implements idempotency via event_id tracking
 */
async function handleWebhook(payload: RevenueCatWebhookPayload): Promise<Response> {
  const eventType = payload.event.type;
  const eventId = payload.event.id;
  const userId = payload.event.app_user_id;

  console.log(`[${eventType}] Processing event: ${eventId} for user: ${userId}`);

  try {
    // Check if we've already processed this event (idempotency)
    const { data: existingEvent } = await supabase
      .from('revenuecat_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      console.log(`[${eventType}] Event already processed (cached):`, eventId);
      return new Response(JSON.stringify({ success: true, cached: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route to appropriate handler
    let result: any;
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'TRIAL_STARTED':
      case 'NON_RENEWING_PURCHASE': // Lifetime purchases (non-subscription)
        result = await handleInitialPurchase(payload.event);
        break;

      case 'RENEWAL':
        result = await handleRenewal(payload.event);
        break;

      case 'CANCELLATION':
      case 'TRIAL_CANCELLED':
        result = await handleCancellation(payload.event);
        break;

      case 'EXPIRATION':
        result = await handleExpiration(payload.event);
        break;

      case 'UNCANCELLATION':
        result = await handleUncancellation(payload.event);
        break;

      case 'PRODUCT_CHANGE':
        result = await handleProductChange(payload.event);
        break;

      case 'BILLING_ISSUE':
        await handleBillingIssue(payload.event);
        result = { success: true };
        break;

      case 'TEST':
        console.log('[TEST] Test event received from RevenueCat');
        result = { success: true, message: 'Test event processed successfully' };
        break;

      default:
        console.warn(`[${eventType}] Unknown event type, skipping`);
        result = { success: true, skipped: true };
    }

    // Log processed event (audit trail)
    await supabase.from('revenuecat_events').insert({
      event_id: eventId,
      event_type: eventType,
      user_id: userId,
      payload,
      processed_at: new Date().toISOString(),
    });

    console.log(`[${eventType}] Event processed successfully:`, eventId);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${eventType}] Error processing event:`, errorMessage);
    console.error(error);

    // Log failed event for debugging
    await supabase.from('revenuecat_events').insert({
      event_id: eventId,
      event_type: eventType,
      user_id: userId,
      payload,
      error: errorMessage,
      processed_at: new Date().toISOString(),
    });

    // Return 400 for client errors (won't retry)
    // Return 500 for server errors (will retry)
    const statusCode = errorMessage.includes('Missing required fields') ? 400 : 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ===================================================
// HTTP SERVER
// ===================================================

serve(async (req: Request) => {
  console.log(`[WEBHOOK] Received ${req.method} request from ${req.headers.get('origin') || 'unknown'}`);

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.warn('[WEBHOOK] Method not allowed:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify authorization
  const authHeader = req.headers.get('authorization');
  const verification = verifyWebhookAuthorization(authHeader);

  if (!verification.valid) {
    console.warn('[WEBHOOK] Unauthorized request:', verification.error);
    return new Response(JSON.stringify({ error: verification.error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse payload
    const payload: RevenueCatWebhookPayload = await req.json();

    // Validate payload structure
    if (!payload.event || !payload.event.type) {
      console.warn('[WEBHOOK] Invalid payload structure:', payload);
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle webhook
    return await handleWebhook(payload);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[WEBHOOK] Failed to parse payload:', errorMessage);

    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
