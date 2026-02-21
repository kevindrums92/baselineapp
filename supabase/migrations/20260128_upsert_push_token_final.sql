-- =====================================================
-- Final production version of upsert_push_token
-- =====================================================
-- This function upserts a push token and allows updating preferences
-- Uses SECURITY DEFINER to bypass RLS for token takeover between users

CREATE OR REPLACE FUNCTION upsert_push_token(
  p_user_id UUID,
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
  -- Upsert the token (bypasses RLS due to SECURITY DEFINER)
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
    p_preferences,
    true,
    NOW()
  )
  ON CONFLICT (token)
  DO UPDATE SET
    user_id = p_user_id,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_push_token(UUID, TEXT, platform_type, JSONB, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION upsert_push_token IS 'Upserts a push token, allowing token transfer between users on the same device. Uses SECURITY DEFINER to bypass RLS.';
