-- ============================================================================
-- Migration: cleanup_orphaned_anonymous_user
-- Date: 2026-02-06
-- Purpose: SECURITY DEFINER function to clean up orphaned anonymous user data
--          after OAuth login with signInWithOAuth (which creates a new user_id
--          instead of linking to the anonymous one).
-- ============================================================================

-- Function: cleanup_orphaned_anonymous_user
-- Called by the client after successful OAuth login to delete the old anonymous
-- user's data. Needs SECURITY DEFINER because the new authenticated user
-- can't delete another user's rows due to RLS (auth.uid() = user_id).
CREATE OR REPLACE FUNCTION cleanup_orphaned_anonymous_user(anon_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Safety: Only clean up if the target user is actually anonymous.
  -- This prevents accidental deletion of real user data.
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = anon_user_id AND is_anonymous = true
  ) THEN
    -- Delete orphaned data from user tables
    DELETE FROM public.user_state WHERE user_id = anon_user_id;
    DELETE FROM public.push_tokens WHERE user_id = anon_user_id;

    -- Delete the anonymous auth user itself
    DELETE FROM auth.users WHERE id = anon_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant to authenticated users only (they call this after OAuth completes)
GRANT EXECUTE ON FUNCTION cleanup_orphaned_anonymous_user(UUID) TO authenticated;

-- ============================================================================
-- Verification:
-- SELECT cleanup_orphaned_anonymous_user('some-anonymous-user-uuid');
-- Should delete from user_state, push_tokens, and auth.users if user is anonymous.
-- Should be a no-op if user is not anonymous or doesn't exist.
-- ============================================================================
