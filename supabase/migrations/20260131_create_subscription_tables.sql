-- ============================================
-- SUBSCRIPTION ARCHITECTURE v2.0
-- ============================================
--
-- This migration creates tables for the new hybrid subscription system:
-- - RevenueCat is the source of truth (via SDK and webhooks)
-- - user_subscriptions is a cache updated ONLY by RevenueCat webhooks
-- - Subscription is NO LONGER part of user_state (separation of concerns)
--
-- Benefits:
-- 1. Single source of truth (RevenueCat) with reliable server-side updates
-- 2. Cross-device sync via RevenueCat SDK + Supabase cache
-- 3. Works offline (localStorage fallback)
-- 4. Web support (reads from Supabase cache)
-- 5. Audit trail via revenuecat_events table
--
-- Author: Claude + JhoTech
-- Date: 2026-01-31
-- ============================================

-- ============================================
-- TABLE: user_subscriptions
-- ============================================
-- Stores the current subscription state for each user.
-- Updated ONLY by RevenueCat webhooks (never by client code).

CREATE TABLE IF NOT EXISTS user_subscriptions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (matches Supabase auth.users.id)
  user_id TEXT NOT NULL UNIQUE,

  -- Product information
  product_id TEXT NOT NULL,                              -- e.g., 'co.baselineapp.monthly'
  entitlement_ids TEXT[] DEFAULT ARRAY['pro'],          -- Features unlocked
  original_transaction_id TEXT,                         -- Original purchase ID from store

  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active',                -- active | trial | expired | cancelled
  period_type TEXT NOT NULL DEFAULT 'normal',           -- normal | trial

  -- Timing
  purchased_at TIMESTAMPTZ NOT NULL,                    -- When subscription started
  expires_at TIMESTAMPTZ,                               -- When it expires (NULL for lifetime)
  billing_issue_detected_at TIMESTAMPTZ,               -- When payment failed

  -- Metadata
  environment TEXT NOT NULL DEFAULT 'PRODUCTION',       -- PRODUCTION | SANDBOX
  last_event_id TEXT,                                   -- Last processed webhook event

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE: revenuecat_events
-- ============================================
-- Audit log of all webhook events received from RevenueCat.
-- Used for idempotency, debugging, and compliance.

CREATE TABLE IF NOT EXISTS revenuecat_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_id TEXT NOT NULL UNIQUE,                       -- RevenueCat event ID
  event_type TEXT NOT NULL,                            -- INITIAL_PURCHASE, RENEWAL, etc.

  -- User association
  user_id TEXT NOT NULL,                               -- App user ID

  -- Event data
  payload JSONB NOT NULL,                              -- Full webhook payload
  error TEXT,                                          -- Error message if processing failed

  -- Timestamps
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- user_subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at
  ON user_subscriptions(expires_at);

-- revenuecat_events indexes
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_event_id
  ON revenuecat_events(event_id);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user_id
  ON revenuecat_events(user_id);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_event_type
  ON revenuecat_events(event_type);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_created_at
  ON revenuecat_events(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Only service role can write to user_subscriptions (webhooks use service key)
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own events (for debugging)
CREATE POLICY "Users can read own events"
  ON revenuecat_events
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Only service role can write events
CREATE POLICY "Service role can manage events"
  ON revenuecat_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, expires_at
  INTO v_status, v_expires_at
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- No subscription found
  IF v_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Lifetime subscription (expires_at is NULL)
  IF v_status = 'active' AND v_expires_at IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Active or trial subscription that hasn't expired
  IF (v_status = 'active' OR v_status = 'trial')
     AND (v_expires_at IS NULL OR v_expires_at > now()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================
-- MIGRATION NOTES
-- ============================================
--
-- BREAKING CHANGES:
-- - The `subscription` field in `user_state.state` is now deprecated
-- - Client code must fetch subscription from `user_subscriptions` table
-- - CloudSyncGate no longer syncs subscription (handled by webhooks)
--
-- DEPLOYMENT STEPS:
-- 1. Run this migration
-- 2. Deploy Edge Function: revenuecat-webhook
-- 3. Configure RevenueCat webhook URL and secret
-- 4. Update client code to use new subscription service
-- 5. Test webhook with RevenueCat test event
--
-- ROLLBACK:
-- If needed, revert by:
-- DROP TABLE user_subscriptions CASCADE;
-- DROP TABLE revenuecat_events CASCADE;
-- DROP FUNCTION has_active_subscription(TEXT);
--
-- ============================================
