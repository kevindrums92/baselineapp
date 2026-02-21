-- Migration: Create user_backups table for cloud backup storage
-- Date: 2026-01-17
-- Purpose: Enable cloud backup functionality (Phase 3)

-- Create user_backups table
CREATE TABLE IF NOT EXISTS user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'auto', 'pre-migration')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes INTEGER NOT NULL,
  checksum TEXT NOT NULL,

  -- Metadata for quick queries
  total_transactions INTEGER NOT NULL,
  total_trips INTEGER NOT NULL,
  schema_version INTEGER NOT NULL,
  app_version TEXT NOT NULL,

  -- Unique constraint to prevent duplicate backups
  CONSTRAINT user_backups_user_id_created_at_key UNIQUE (user_id, created_at)
);

-- Create index for quick retrieval by user and creation time
CREATE INDEX IF NOT EXISTS idx_user_backups_user_created
  ON user_backups(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own backups
CREATE POLICY "Users can view own backups"
  ON user_backups FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own backups
CREATE POLICY "Users can create own backups"
  ON user_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own backups
CREATE POLICY "Users can delete own backups"
  ON user_backups FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-delete old backups (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM user_backups
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Schedule this function to run daily via pg_cron or Supabase Edge Function
-- Example cron: SELECT cron.schedule('cleanup-old-backups', '0 3 * * *', 'SELECT cleanup_old_backups()');
