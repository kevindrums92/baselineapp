-- Migration: Create user_state table with Row Level Security
-- Date: 2026-01-25
-- Priority: CRITICAL - Must be applied before production deployment
-- Purpose: Store user application state with proper RLS policies

-- Create user_state table if not exists
CREATE TABLE IF NOT EXISTS user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: One state per user
  CONSTRAINT unique_user_state UNIQUE (user_id)
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_state_user_id ON user_state(user_id);

-- Create index for updated_at (useful for sync operations)
CREATE INDEX IF NOT EXISTS idx_user_state_updated_at ON user_state(updated_at DESC);

-- Enable Row Level Security (CRITICAL)
ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view ONLY their own state
CREATE POLICY "Users can view own state"
  ON user_state FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update ONLY their own state
CREATE POLICY "Users can update own state"
  ON user_state FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert ONLY their own state
CREATE POLICY "Users can insert own state"
  ON user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete ONLY their own state
CREATE POLICY "Users can delete own state"
  ON user_state FOR DELETE
  USING (auth.uid() = user_id);

-- Add table and column comments for documentation
COMMENT ON TABLE user_state IS 'Stores complete user application state including transactions, categories, trips, and budgets';
COMMENT ON COLUMN user_state.user_id IS 'Foreign key to auth.users - owner of this state';
COMMENT ON COLUMN user_state.state IS 'JSONB containing BudgetState (schemaVersion, transactions, categories, etc.)';
COMMENT ON COLUMN user_state.updated_at IS 'Timestamp of last state update - used for sync conflict resolution';
COMMENT ON COLUMN user_state.created_at IS 'Timestamp of initial state creation';

-- Function to automatically update updated_at on state changes
CREATE OR REPLACE FUNCTION update_user_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_state_updated_at
  BEFORE UPDATE ON user_state
  FOR EACH ROW
  EXECUTE FUNCTION update_user_state_timestamp();

-- Verification queries (uncomment to test after applying migration)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_state';
-- SELECT * FROM pg_policies WHERE tablename = 'user_state';
