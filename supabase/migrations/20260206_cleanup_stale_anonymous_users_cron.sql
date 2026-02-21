-- ============================================================================
-- Migration: Cron job to clean up stale anonymous users
-- Date: 2026-02-06
-- Purpose: Periodically delete anonymous users who haven't been active in 60+
--          days. These are orphaned sessions from users who uninstalled the app
--          or abandoned it without ever logging in.
-- ============================================================================
-- Prerequisites: pg_cron and pg_net extensions must be enabled
--   (already enabled by 20260128_setup_notification_cron_jobs.sql)
-- ============================================================================

-- Function that performs the cleanup (SECURITY DEFINER to access auth.users)
CREATE OR REPLACE FUNCTION cleanup_stale_anonymous_users()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Step 1: Delete data from app tables for stale anonymous users
  DELETE FROM public.user_state
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '60 days'
  );

  DELETE FROM public.push_tokens
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '60 days'
  );

  -- Step 2: Delete the anonymous auth users themselves
  DELETE FROM auth.users
  WHERE is_anonymous = true
    AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '60 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE LOG '[cleanup_stale_anonymous_users] Deleted % stale anonymous users', deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only callable by service role (cron runs as postgres)
REVOKE ALL ON FUNCTION cleanup_stale_anonymous_users() FROM PUBLIC;

-- ============================================================================
-- Schedule: Every Sunday at 4:00 AM UTC
-- ============================================================================
SELECT cron.schedule(
  'cleanup-stale-anonymous-users',
  '0 4 * * 0',  -- Sundays at 4:00 AM UTC
  $$ SELECT cleanup_stale_anonymous_users(); $$
);

-- ============================================================================
-- Verification / Manual run:
--   SELECT cleanup_stale_anonymous_users();
--
-- Check how many would be affected (dry run):
--   SELECT COUNT(*) FROM auth.users
--   WHERE is_anonymous = true
--     AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '60 days';
--
-- View cron job:
--   SELECT * FROM cron.job WHERE jobname = 'cleanup-stale-anonymous-users';
--
-- View run history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stale-anonymous-users')
--   ORDER BY start_time DESC LIMIT 10;
--
-- Remove job (if needed):
--   SELECT cron.unschedule('cleanup-stale-anonymous-users');
-- ============================================================================
