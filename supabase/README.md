# Supabase Migrations

This directory contains SQL migrations for the BaselineApp database schema.

## 🔴 CRITICAL: Migration Order

**If `user_state` table already exists** (you get "column does not exist" error):
1. **20260125_fix_user_state_schema.sql** (CRITICAL - fixes existing table)

**If `user_state` table does NOT exist** (fresh database):
1. **20260125_create_user_state_with_rls.sql** (CRITICAL - creates new table)

**Then apply these in order**:
2. **20260117_create_user_backups.sql** (stores backup files)
3. **20260123_create_trusted_devices.sql** (stores trusted device fingerprints)

⚠️ **Security Notice**: `user_state` table MUST have RLS enabled before production use.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for Manual Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file you want to apply
4. Paste into the SQL editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (first time only)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Available Migrations

### 🔴 20260125_fix_user_state_schema.sql (CRITICAL - Use if table exists)

**Priority**: 🔴 **CRITICAL** - Use this if you already have `user_state` table

**When to use**: If you get error "column 'created_at' does not exist" or similar

This script:
- Adds missing columns to existing `user_state` table
- Enables Row Level Security (if not already enabled)
- Creates all RLS policies
- Adds indexes and constraints
- Creates trigger for auto-updating `updated_at`

**Safe to run multiple times** - Uses `IF NOT EXISTS` checks

**To apply**:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `20260125_fix_user_state_schema.sql`
3. Run the SQL
4. Check the NOTICE messages for what was added
5. Run the verification queries at the bottom

**Verification**: Scroll to bottom of script output to see verification queries results.

---

### 🔴 20260125_create_user_state_with_rls.sql (ALTERNATIVE - Only for new databases)

**Priority**: 🔴 **CRITICAL** - Only use if `user_state` table does NOT exist

**When to use**: Fresh database without existing `user_state` table

**Priority**: 🔴 **CRITICAL** - Must be applied before production deployment

Creates the `user_state` table with Row Level Security policies.

**⚠️ SECURITY WARNING**: This table stores ALL user data. RLS is MANDATORY to prevent unauthorized access.

**Features:**
- Stores complete user application state as JSONB
- Row Level Security (RLS) policies ensure users ONLY access their own data
- Automatic `updated_at` timestamp trigger for sync operations
- Indexes for fast user lookups and sync queries
- CASCADE delete when user account is deleted

**Schema**:
```sql
CREATE TABLE user_state (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);
```

**RLS Policies**:
- `Users can view own state` - SELECT only where `auth.uid() = user_id`
- `Users can update own state` - UPDATE only their own row
- `Users can insert own state` - INSERT with user_id validation
- `Users can delete own state` - DELETE only their own row

**To apply this migration**:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `20260125_create_user_state_with_rls.sql`
3. Run the SQL
4. **VERIFY RLS is enabled** (see verification commands below)

**Verification (CRITICAL)**:
```sql
-- 1. Check if table exists
SELECT * FROM user_state LIMIT 1;

-- 2. CRITICAL: Verify RLS is enabled (rowsecurity MUST be true)
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_state';
-- Expected: rowsecurity = true

-- 3. CRITICAL: Verify all 4 RLS policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_state';
-- Expected: 4 policies (SELECT, UPDATE, INSERT, DELETE)

-- 4. Test that RLS works (should return only current user's data)
SELECT * FROM user_state WHERE user_id = auth.uid();

-- 5. Test that you CANNOT access another user's data (should return 0 rows)
SELECT * FROM user_state WHERE user_id != auth.uid();
```

**Security Testing**:
After applying, test with TWO different user accounts:
1. User A creates data
2. User B tries to access User A's data (should be blocked)
3. User A should only see their own data

---

### 20260117_create_user_backups.sql

Creates the `user_backups` table for cloud backup storage (Phase 3).

**Features:**
- Stores complete backup files as JSONB
- Tracks backup metadata (type, size, checksum)
- Row Level Security (RLS) policies ensure users only see their own backups
- Automatic cleanup function for backups older than 30 days
- Indexes for fast retrieval

**To apply this migration manually:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `20260117_create_user_backups.sql`
3. Run the SQL
4. Verify the table exists in **Database → Tables**

## Scheduled Cleanup (Optional)

The migration includes a `cleanup_old_backups()` function that deletes backups older than 30 days. To run this automatically:

### Option A: Using pg_cron (if available)

```sql
SELECT cron.schedule(
  'cleanup-old-backups',
  '0 3 * * *',  -- Run daily at 3 AM UTC
  'SELECT cleanup_old_backups()'
);
```

### Option B: Using Supabase Edge Function

Create a scheduled Edge Function that calls the cleanup function daily.

### Option C: Manual Cleanup

You can also run the cleanup manually whenever needed:

```sql
SELECT cleanup_old_backups();
```

## Verifying the Migration

After applying the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM user_backups LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_backups';

-- Check if cleanup function exists
SELECT proname FROM pg_proc WHERE proname = 'cleanup_old_backups';
```

## Troubleshooting

**Error: relation "user_backups" already exists**
- The migration has already been applied. No action needed.

**Error: permission denied**
- Make sure you're running the migration as a superuser or database owner.

**Error: RLS policy already exists**
- The migration has already been applied. You can drop existing policies first:
  ```sql
  DROP POLICY IF EXISTS "Users can view own backups" ON user_backups;
  DROP POLICY IF EXISTS "Users can create own backups" ON user_backups;
  DROP POLICY IF EXISTS "Users can delete own backups" ON user_backups;
  ```

## Next Steps

After applying the migration:

1. Test backup creation in the app (authenticated user only)
2. Verify backups appear in `user_backups` table
3. Test restore functionality
4. Test delete functionality
5. (Optional) Set up automatic cleanup via pg_cron or Edge Function

---

## 🔒 Security Best Practices

### Row Level Security (RLS)

**CRITICAL**: All tables storing user data MUST have RLS enabled.

**Status**:
- ✅ `user_state` - RLS enabled (see `20260125_create_user_state_with_rls.sql`)
- ✅ `user_backups` - RLS enabled (see `20260117_create_user_backups.sql`)
- ✅ `trusted_devices` - RLS enabled (see `20260123_create_trusted_devices.sql`)

**Verify RLS is working**:
```sql
-- Should return TRUE for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_state', 'user_backups', 'trusted_devices');
```

### API Keys

**Anon Key** (public):
- Safe to use in client-side code
- RLS policies apply automatically
- Users can only access their own data

**Service Role Key** (secret):
- NEVER expose to clients
- Bypasses RLS (full database access)
- Only use in trusted server environments

### CORS Configuration

In Supabase Dashboard → Settings → API:
- Add your production domain to allowed origins
- Remove `*` (wildcard) before production deployment

---

## 📚 Additional Resources

- **Security Audit**: See `docs/SECURITY_AUDIT.md` for comprehensive security analysis
- **Supabase RLS Guide**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Database Schema**: See table definitions in migration files

---

## 🐛 Reporting Security Issues

If you discover a security vulnerability, please email: security@baselineapp.com

DO NOT open a public issue for security vulnerabilities.
