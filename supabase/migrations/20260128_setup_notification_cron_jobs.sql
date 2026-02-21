-- =====================================================
-- Cron Jobs for Push Notifications
-- =====================================================
-- This migration sets up scheduled tasks using pg_cron extension
-- to trigger the Edge Functions at specified intervals.
--
-- IMPORTANT: Before running this migration:
-- 1. Enable pg_cron extension in Supabase Dashboard:
--    Database → Extensions → Search "pg_cron" → Enable
-- 2. Enable pg_net extension in Supabase Dashboard:
--    Database → Extensions → Search "pg_net" → Enable
-- 3. Store secrets in Vault:
--    - supabase_url: Your Supabase project URL
--    - supabase_service_role_key: Your service role key
--
-- ALTERNATIVE: If you prefer not to use pg_cron, you can trigger
-- the Edge Functions using external cron services like:
-- - GitHub Actions scheduled workflows
-- - Render.com cron jobs
-- - AWS EventBridge
-- - Any other cron service that can make HTTP POST requests

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- 1. DAILY REMINDER - Every minute
-- =====================================================
-- Checks every minute for users whose reminder time matches current time
-- and who haven't registered any transactions today.

SELECT cron.schedule(
  'send-daily-reminder',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-daily-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- =====================================================
-- 2. UPCOMING TRANSACTIONS - Daily at 9:00 AM UTC
-- =====================================================
-- Checks once daily for scheduled/pending transactions due tomorrow.

SELECT cron.schedule(
  'send-upcoming-transactions',
  '0 9 * * *', -- 9:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-upcoming-transactions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- =====================================================
-- 3. DAILY SUMMARY - Every minute
-- =====================================================
-- Checks every minute for users whose summary time matches current time
-- and who have activity today.

SELECT cron.schedule(
  'send-daily-summary',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-daily-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- =====================================================
-- Helper: View scheduled jobs
-- =====================================================
-- To view all scheduled jobs:
-- SELECT * FROM cron.job;

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- =====================================================
-- CLEANUP: To remove jobs (if needed)
-- =====================================================
-- SELECT cron.unschedule('send-daily-reminder');
-- SELECT cron.unschedule('send-upcoming-transactions');
-- SELECT cron.unschedule('send-daily-summary');
