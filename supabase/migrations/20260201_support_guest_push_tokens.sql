-- =====================================================
-- Support push tokens for guest users (not authenticated)
-- =====================================================
-- This migration enables push notifications for guest users by:
-- 1. Making user_id nullable (guests won't have a user_id)
-- 2. Updating RLS policies to allow guest token operations
-- 3. Updating RPC functions to accept null user_id
-- 4. Adding a migration function for when guests log in

-- =====================================================
-- STEP 1: Modify push_tokens table
-- =====================================================

-- Make user_id nullable to support guest tokens
ALTER TABLE push_tokens
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for querying active tokens by token value (for guests)
CREATE INDEX IF NOT EXISTS idx_push_tokens_token_active
ON push_tokens(token) WHERE is_active = true;

-- Make user_id nullable in notification_history as well
ALTER TABLE notification_history
ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- STEP 2: Update RLS policies for guest support
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view any token" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON push_tokens;

-- Allow authenticated users to view their own tokens
-- Allow anon users to view tokens (they'll be filtered by token in the app)
CREATE POLICY "Users can view tokens"
  ON push_tokens FOR SELECT
  USING (
    user_id IS NULL OR  -- Guest tokens (no user_id)
    auth.uid() = user_id  -- Authenticated user's tokens
  );

-- Allow inserting tokens for authenticated users OR guest users (user_id = null)
CREATE POLICY "Users can insert tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (
    user_id IS NULL OR  -- Guest token
    auth.uid() = user_id  -- Authenticated user token
  );

-- Allow updating tokens (for token takeover and guest → authenticated migration)
CREATE POLICY "Users can update tokens"
  ON push_tokens FOR UPDATE
  USING (
    user_id IS NULL OR  -- Guest tokens
    auth.uid() = user_id  -- User's own tokens
  )
  WITH CHECK (
    user_id IS NULL OR  -- Can update to guest
    auth.uid() = user_id  -- Or to authenticated user (must match)
  );

-- Allow deleting tokens (for disabling push notifications)
CREATE POLICY "Users can delete tokens"
  ON push_tokens FOR DELETE
  USING (
    user_id IS NULL OR  -- Guest tokens (anyone can delete)
    auth.uid() = user_id  -- Authenticated user's own tokens
  );

-- =====================================================
-- STEP 3: Update upsert_push_token function
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id UUID,  -- Now accepts NULL for guest users
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB,
  p_preferences JSONB
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Upsert the token (works for both authenticated and guest users)
  INSERT INTO push_tokens (
    user_id,
    token,
    platform,
    device_info,
    preferences,
    is_active,
    last_used_at
  )
  VALUES (
    p_user_id,  -- Can be NULL for guests
    p_token,
    p_platform,
    p_device_info,
    p_preferences,
    true,
    NOW()
  )
  ON CONFLICT (token)
  DO UPDATE SET
    user_id = p_user_id,  -- Update user_id (important for guest → authenticated migration)
    platform = p_platform,
    device_info = p_device_info,
    preferences = p_preferences,
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Grant execute to both authenticated and anon users
GRANT EXECUTE ON FUNCTION upsert_push_token(UUID, TEXT, platform_type, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_push_token(UUID, TEXT, platform_type, JSONB, JSONB) TO anon;

COMMENT ON FUNCTION upsert_push_token IS 'Upserts a push token for authenticated or guest users. Allows token migration when guest logs in.';

-- =====================================================
-- STEP 4: Update refresh_push_token function
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_push_token(
  p_user_id UUID,  -- Now accepts NULL for guest users
  p_token TEXT,
  p_platform platform_type,
  p_device_info JSONB
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Update existing token record (bypasses RLS)
  UPDATE push_tokens
  SET
    user_id = p_user_id,  -- Update user_id (can be NULL or a UUID)
    platform = p_platform,
    device_info = p_device_info,
    is_active = true,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE token = p_token
  RETURNING id INTO v_token_id;

  -- If token doesn't exist, insert with defaults
  IF v_token_id IS NULL THEN
    INSERT INTO push_tokens (
      user_id,
      token,
      platform,
      device_info,
      preferences,
      is_active,
      last_used_at
    )
    VALUES (
      p_user_id,  -- Can be NULL for guests
      p_token,
      p_platform,
      p_device_info,
      '{"quiet_hours":{"end":"00:00","start":"23:59","enabled":false},"daily_summary":{"time":"20:00","enabled":false},"daily_reminder":{"time":"20:00","enabled":false},"scheduled_transactions":true}'::jsonb,
      true,
      NOW()
    )
    RETURNING id INTO v_token_id;
  END IF;

  -- Deactivate any other active tokens for this user (only if user_id is not null)
  IF p_user_id IS NOT NULL THEN
    UPDATE push_tokens
    SET is_active = false
    WHERE user_id = p_user_id
      AND id != v_token_id
      AND is_active = true;
  END IF;

  RETURN v_token_id;
END;
$$;

-- Grant execute to both authenticated and anon users
GRANT EXECUTE ON FUNCTION refresh_push_token(UUID, TEXT, platform_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_push_token(UUID, TEXT, platform_type, JSONB) TO anon;

COMMENT ON FUNCTION refresh_push_token IS 'Refreshes token metadata WITHOUT touching preferences. Works for authenticated and guest users.';

-- =====================================================
-- STEP 5: Add function to migrate guest tokens when user logs in
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_guest_token_to_user(
  p_user_id UUID,
  p_token TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Update the guest token to associate it with the authenticated user
  UPDATE push_tokens
  SET
    user_id = p_user_id,
    updated_at = NOW()
  WHERE token = p_token
    AND (user_id IS NULL OR user_id != p_user_id)  -- Only migrate if it's a guest token or from different user
  RETURNING id INTO v_token_id;

  -- If successful, deactivate any other active tokens for this user
  IF v_token_id IS NOT NULL THEN
    UPDATE push_tokens
    SET is_active = false
    WHERE user_id = p_user_id
      AND id != v_token_id
      AND is_active = true;
  END IF;

  RETURN v_token_id;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION migrate_guest_token_to_user(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION migrate_guest_token_to_user IS 'Migrates a guest token to an authenticated user when they log in.';

-- =====================================================
-- STEP 6: Update table comments
-- =====================================================

COMMENT ON COLUMN push_tokens.user_id IS 'User ID from auth.users (NULL for guest users)';
COMMENT ON COLUMN notification_history.user_id IS 'User ID from auth.users (NULL for guest notifications)';
