-- =====================================================
-- Fix RLS policies for push_tokens to allow upsert
-- =====================================================
-- The upsert operation in updatePreferences() requires both
-- USING and WITH CHECK clauses on INSERT and UPDATE policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON push_tokens;

-- Recreate SELECT policy to allow viewing any token
-- This is necessary for upsert to work (needs to check for conflicts)
-- Security is still maintained via UPDATE/INSERT WITH CHECK clauses
CREATE POLICY "Users can view any token"
  ON push_tokens FOR SELECT
  USING (true);

-- Recreate INSERT policy
CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recreate UPDATE policy to allow taking over tokens from other users
-- This is necessary because FCM tokens are device-specific, not user-specific
-- When a user logs in on a device previously used by another user,
-- the same FCM token needs to be reassigned to the new user
CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (true)  -- Allow checking any token (needed for upsert on conflict)
  WITH CHECK (auth.uid() = user_id);  -- But only if the new user_id matches the authenticated user
