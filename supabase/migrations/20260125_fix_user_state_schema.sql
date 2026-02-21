-- Migration: Fix user_state table schema and add RLS
-- Date: 2026-01-25
-- Priority: CRITICAL
-- Purpose: Add missing columns and RLS policies to existing user_state table

-- Step 1: Check current schema (run this first to see what exists)
-- Uncomment to diagnose:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_state'
-- ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_state' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE user_state ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added created_at column';
  ELSE
    RAISE NOTICE 'created_at column already exists';
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_state' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_state ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added updated_at column';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;

  -- Add id column if it doesn't exist (unlikely but check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_state' AND column_name = 'id'
  ) THEN
    ALTER TABLE user_state ADD COLUMN id UUID DEFAULT gen_random_uuid();
    RAISE NOTICE 'Added id column';
  ELSE
    RAISE NOTICE 'id column already exists';
  END IF;
END $$;

-- Step 3: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_state_user_id ON user_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_state_updated_at ON user_state(updated_at DESC);

-- Step 4: Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_state'
  ) THEN
    ALTER TABLE user_state ADD CONSTRAINT unique_user_state UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id';
  ELSE
    RAISE NOTICE 'unique_user_state constraint already exists';
  END IF;
END $$;

-- Step 5: Enable Row Level Security (CRITICAL)
ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own state" ON user_state;
DROP POLICY IF EXISTS "Users can update own state" ON user_state;
DROP POLICY IF EXISTS "Users can insert own state" ON user_state;
DROP POLICY IF EXISTS "Users can delete own state" ON user_state;

-- Step 7: Create RLS policies
CREATE POLICY "Users can view own state"
  ON user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own state"
  ON user_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own state"
  ON user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own state"
  ON user_state FOR DELETE
  USING (auth.uid() = user_id);

-- Step 8: Add comments for documentation
COMMENT ON TABLE user_state IS 'Stores complete user application state including transactions, categories, trips, and budgets';
COMMENT ON COLUMN user_state.user_id IS 'Foreign key to auth.users - owner of this state';
COMMENT ON COLUMN user_state.state IS 'JSONB containing BudgetState (schemaVersion, transactions, categories, etc.)';
COMMENT ON COLUMN user_state.updated_at IS 'Timestamp of last state update - used for sync conflict resolution';
COMMENT ON COLUMN user_state.created_at IS 'Timestamp of initial state creation';

-- Step 9: Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_user_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_user_state_updated_at ON user_state;
CREATE TRIGGER update_user_state_updated_at
  BEFORE UPDATE ON user_state
  FOR EACH ROW
  EXECUTE FUNCTION update_user_state_timestamp();

-- Step 11: Verification queries
-- Run these after the migration completes:

-- 1. Check all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_state'
ORDER BY ordinal_position;

-- 2. CRITICAL: Verify RLS is enabled (rowsecurity MUST be true)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_state';

-- 3. CRITICAL: Verify all 4 RLS policies exist
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_state'
ORDER BY policyname;

-- 4. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_state'
ORDER BY indexname;

-- 5. Check constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_state'::regclass;

-- Expected output:
-- - rowsecurity = TRUE
-- - 4 policies: SELECT, UPDATE, INSERT, DELETE
-- - 2 indexes: idx_user_state_user_id, idx_user_state_updated_at
-- - 1 unique constraint: unique_user_state
-- - Columns: id, user_id, state, created_at, updated_at
