-- =====================================================
-- Fix token refresh to preserve preferences
-- =====================================================
-- Add a new function for token refresh that doesn't touch preferences
-- Keep upsert_push_token for first-time registration and preference updates

-- New function: refresh existing token without touching preferences
CREATE OR REPLACE FUNCTION refresh_push_token(
  p_user_id UUID,
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
    user_id = p_user_id,
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
      p_user_id,
      p_token,
      p_platform,
      p_device_info,
      '{"quiet_hours":{"end":"00:00","start":"23:59","enabled":false},"daily_summary":{"time":"20:00","enabled":false},"daily_reminder":{"time":"20:00","enabled":false},"scheduled_transactions":true}'::jsonb,
      true,
      NOW()
    )
    RETURNING id INTO v_token_id;
  END IF;

  -- Deactivate any other active tokens for this user (keep only the latest)
  UPDATE push_tokens
  SET is_active = false
  WHERE user_id = p_user_id
    AND id != v_token_id
    AND is_active = true;

  RETURN v_token_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_push_token(UUID, TEXT, platform_type, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION refresh_push_token IS 'Refreshes a push token metadata (user_id, platform, device_info) WITHOUT touching preferences. Used for token refresh on app restart.';
