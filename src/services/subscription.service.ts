/**
 * Subscription Service
 *
 * Fetches subscription state from multiple sources with fallback strategy:
 * 1. RevenueCat SDK (most up-to-date, requires internet)
 * 2. Supabase user_subscriptions table (server cache, updated by webhooks)
 * 3. LocalStorage (offline fallback)
 *
 * CRITICAL: This service READS subscription state. Only RevenueCat webhooks WRITE to Supabase.
 *
 * Architecture:
 * - RevenueCat SDK: Source of truth on mobile
 * - Supabase: Cache for web/cross-device sync (updated via webhooks)
 * - LocalStorage: Offline persistence
 *
 * @see docs/inapppurchases/SUBSCRIPTION_ARCHITECTURE.md
 */

import { supabase } from '@/lib/supabaseClient';
import type { SubscriptionState } from '@/types/app.types';
import { getCustomerInfo as getRevenueCatCustomerInfo } from './revenuecat.service';
import { PRICING_PLANS } from '@/constants/pricing';
import { Capacitor } from '@capacitor/core';
import { getNetworkStatus } from '@/services/network.service';

// ===================================================
// TYPES
// ===================================================

/**
 * Database row from user_subscriptions table
 */
interface UserSubscriptionRow {
  id: string;
  user_id: string;
  product_id: string;
  entitlement_ids: string[];
  original_transaction_id: string | null;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  period_type: 'trial' | 'normal';
  purchased_at: string;
  expires_at: string | null;
  environment: 'PRODUCTION' | 'SANDBOX';
  billing_issue_detected_at: string | null;
  last_event_id: string;
  created_at: string;
  updated_at: string;
}

// ===================================================
// LOCALSTORAGE PERSISTENCE
// ===================================================

const SUBSCRIPTION_STORAGE_KEY = 'subscription';

/**
 * Saves subscription to localStorage for offline access
 */
function saveSubscriptionToLocalStorage(subscription: SubscriptionState | null): void {
  try {
    if (subscription) {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    } else {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    }
  } catch (error) {
    console.error('[Subscription] Failed to save to localStorage:', error);
  }
}

/**
 * Loads subscription from localStorage
 *
 * @param skipExpirationCheck - When true, returns cached subscription even if expired.
 *   Used when offline so Pro users keep access until we can verify online.
 */
function loadSubscriptionFromLocalStorage(skipExpirationCheck = false): SubscriptionState | null {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!stored) return null;

    const subscription: SubscriptionState = JSON.parse(stored);

    // Validate expiration (skip when offline to keep Pro access)
    if (!skipExpirationCheck && subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      console.log('[Subscription] Cached subscription expired');
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('[Subscription] Failed to load from localStorage:', error);
    return null;
  }
}

// ===================================================
// MAPPING FUNCTIONS
// ===================================================

/**
 * Maps database row to SubscriptionState type
 */
function mapDatabaseRowToSubscriptionState(
  row: UserSubscriptionRow
): SubscriptionState {
  // Determine subscription type from product_id
  // Type represents the plan tier (monthly/annual/lifetime), NOT the trial status
  let type: SubscriptionState['type'] = 'free';

  if (row.product_id === PRICING_PLANS.monthly.id) {
    type = 'monthly';
  } else if (row.product_id === PRICING_PLANS.annual.id) {
    type = 'annual';
  } else if (row.product_id === PRICING_PLANS.lifetime.id) {
    type = 'lifetime';
  }

  // Determine status
  let status: SubscriptionState['status'] = 'free';

  if (row.status === 'trial') {
    // Check if trial is still valid
    if (row.expires_at && new Date(row.expires_at) > new Date()) {
      status = 'trialing';
    } else {
      status = 'expired';
    }
  } else if (row.status === 'active') {
    // Check if subscription is still valid
    if (!row.expires_at || new Date(row.expires_at) > new Date()) {
      status = 'active';
    } else {
      status = 'expired';
    }
  } else if (row.status === 'cancelled') {
    status = 'cancelled';
  } else if (row.status === 'expired') {
    status = 'expired';
  }

  // Promo/gift subscriptions have no original_transaction_id (not from App Store)
  const isPromo = !row.original_transaction_id;

  return {
    status,
    type,
    trialEndsAt: row.period_type === 'trial' ? row.expires_at : null,
    expiresAt: row.expires_at,
    lastChecked: new Date().toISOString(),
    isPromo,
  };
}

// ===================================================
// FETCH FUNCTIONS
// ===================================================

/**
 * Fetches subscription from RevenueCat SDK
 * Only works on native platforms with internet connection
 */
async function fetchFromRevenueCat(): Promise<SubscriptionState | null> {
  const platform = Capacitor.getPlatform();

  // Only fetch from SDK on native platforms
  if (platform === 'web') {
    console.log('[Subscription] Skipping RevenueCat on web');
    return null;
  }

  try {
    console.log('[Subscription] Fetching from RevenueCat SDK...');
    const customerInfo = await getRevenueCatCustomerInfo();

    // Map RevenueCat customerInfo to SubscriptionState
    const entitlements = customerInfo.entitlements?.pro;

    if (!entitlements || !entitlements.isActive) {
      console.log('[Subscription] No active entitlements in RevenueCat');
      return null;
    }

    // Determine type from product ID
    // Type represents the plan tier (monthly/annual/lifetime), NOT the trial status
    let type: SubscriptionState['type'] = 'free';
    if (entitlements.productIdentifier === PRICING_PLANS.monthly.id) {
      type = 'monthly';
    } else if (entitlements.productIdentifier === PRICING_PLANS.annual.id) {
      type = 'annual';
    } else if (entitlements.productIdentifier === PRICING_PLANS.lifetime.id) {
      type = 'lifetime';
    }

    // Determine status
    // RevenueCat periodType is uppercase: 'TRIAL', 'INTRO', 'NORMAL'
    const isTrialing = entitlements.periodType?.toUpperCase() === 'TRIAL';
    let status: SubscriptionState['status'] = 'active';

    if (isTrialing) {
      if (entitlements.expirationDate && new Date(entitlements.expirationDate) > new Date()) {
        status = 'trialing';
        // Keep the base plan type (monthly/annual/lifetime), don't override to 'trial'
      } else {
        status = 'expired';
      }
    } else if (entitlements.expirationDate && new Date(entitlements.expirationDate) < new Date()) {
      status = 'expired';
    }

    const subscription: SubscriptionState = {
      status,
      type,
      trialEndsAt: isTrialing ? entitlements.expirationDate : null,
      expiresAt: entitlements.expirationDate,
      lastChecked: new Date().toISOString(),
    };

    console.log('[Subscription] Fetched from RevenueCat:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Subscription] Failed to fetch from RevenueCat:', error);
    return null;
  }
}

/**
 * Fetches subscription from Supabase user_subscriptions table
 * Requires authenticated user
 */
async function fetchFromSupabase(userId: string): Promise<SubscriptionState | null> {
  try {
    console.log('[Subscription] Fetching from Supabase...');

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found (user is free tier)
        console.log('[Subscription] No subscription in Supabase (free tier)');
        return null;
      }
      throw error;
    }

    if (!data) {
      console.log('[Subscription] No subscription data');
      return null;
    }

    const subscription = mapDatabaseRowToSubscriptionState(data);
    console.log('[Subscription] Fetched from Supabase:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Subscription] Failed to fetch from Supabase:', error);
    return null;
  }
}

// ===================================================
// PUBLIC API
// ===================================================

/**
 * Fetches subscription with fallback strategy:
 * 1. Try RevenueCat SDK (native only, most up-to-date)
 * 2. Try Supabase (web/cross-device, updated by webhooks)
 * 3. Fall back to localStorage (offline)
 *
 * @param userId - Supabase user ID (required for Supabase fetch)
 * @returns SubscriptionState or null if user is free tier
 */
export async function getSubscription(
  userId: string | null
): Promise<SubscriptionState | null> {
  console.log('[Subscription] getSubscription called for user:', userId);

  // Strategy 1: Try RevenueCat SDK (native only)
  const revenuecatSubscription = await fetchFromRevenueCat();
  if (revenuecatSubscription) {
    // If RevenueCat says active/trialing, trust it directly
    if (revenuecatSubscription.status === 'active' || revenuecatSubscription.status === 'trialing') {
      saveSubscriptionToLocalStorage(revenuecatSubscription);
      return revenuecatSubscription;
    }

    // If RevenueCat says expired/cancelled, check Supabase for a promo lifetime
    // (Promo codes write directly to Supabase, so RevenueCat won't know about them)
    if (userId) {
      const supabaseSubscription = await fetchFromSupabase(userId);
      if (supabaseSubscription && supabaseSubscription.type === 'lifetime' && supabaseSubscription.status === 'active') {
        console.log('[Subscription] RevenueCat expired but Supabase has active lifetime (promo), using Supabase');
        saveSubscriptionToLocalStorage(supabaseSubscription);
        return supabaseSubscription;
      }
    }

    // No lifetime promo in Supabase, respect RevenueCat's verdict
    saveSubscriptionToLocalStorage(revenuecatSubscription);
    return revenuecatSubscription;
  }

  // Strategy 2: Try Supabase (if user is authenticated)
  if (userId) {
    const supabaseSubscription = await fetchFromSupabase(userId);
    if (supabaseSubscription) {
      saveSubscriptionToLocalStorage(supabaseSubscription);
      return supabaseSubscription;
    }
  }

  // Strategy 3: Fall back to localStorage (offline)
  // If offline, trust cache regardless of expiration so Pro users keep access
  // until we can verify online (on reconnect, RevenueCatProvider will re-check)
  const isOnline = await getNetworkStatus();
  const cachedSubscription = loadSubscriptionFromLocalStorage(!isOnline);
  if (cachedSubscription) {
    console.log(`[Subscription] Using cached subscription from localStorage (offline: ${!isOnline})`);
    return cachedSubscription;
  }

  // No subscription found
  console.log('[Subscription] No subscription found (free tier)');
  return null;
}

/**
 * Clears subscription from localStorage
 * Call this on logout
 */
export function clearSubscriptionCache(): void {
  console.log('[Subscription] Clearing localStorage cache');
  localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
}

/**
 * Forces a refresh of the subscription from RevenueCat or Supabase
 * Bypasses localStorage cache
 *
 * @param userId - Supabase user ID
 * @returns Fresh subscription state
 */
export async function refreshSubscription(
  userId: string | null
): Promise<SubscriptionState | null> {
  console.log('[Subscription] Force refreshing subscription...');

  // Try RevenueCat first
  const revenuecatSubscription = await fetchFromRevenueCat();
  if (revenuecatSubscription) {
    saveSubscriptionToLocalStorage(revenuecatSubscription);
    return revenuecatSubscription;
  }

  // Try Supabase
  if (userId) {
    const supabaseSubscription = await fetchFromSupabase(userId);
    if (supabaseSubscription) {
      saveSubscriptionToLocalStorage(supabaseSubscription);
      return supabaseSubscription;
    }
  }

  // Clear cache if no subscription found
  clearSubscriptionCache();
  return null;
}
