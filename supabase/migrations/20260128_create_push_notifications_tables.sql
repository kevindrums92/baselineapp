-- =====================================================
-- Push Notifications Tables
-- =====================================================
-- This migration creates the tables needed for push notifications:
-- 1. push_tokens: Stores FCM tokens for each user's devices
-- 2. notification_history: Tracks sent notifications

-- =====================================================
-- 1. PUSH_TOKENS TABLE
-- =====================================================

-- Enum for platforms
CREATE TYPE platform_type AS ENUM ('ios', 'android');

-- Main tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform platform_type NOT NULL,
  device_info JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "scheduled_transactions": true,
    "daily_reminder": {
      "enabled": false,
      "time": "20:00"
    },
    "daily_summary": {
      "enabled": false,
      "time": "20:00"
    },
    "quiet_hours": {
      "enabled": false,
      "start": "23:59",
      "end": "00:00"
    }
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one token per device
  CONSTRAINT unique_token UNIQUE (token)
);

-- Indexes for performance
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_push_tokens_user_active ON push_tokens(user_id, is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. NOTIFICATION_HISTORY TABLE
-- =====================================================

-- Enum for notification status
CREATE TYPE notification_status AS ENUM ('sent', 'delivered', 'clicked', 'failed');

-- Enum for notification types
CREATE TYPE notification_type AS ENUM (
  'daily_reminder',
  'upcoming_transaction_scheduled',
  'upcoming_transaction_pending',
  'upcoming_transactions_multiple',
  'daily_summary'
);

-- History table
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES push_tokens(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status notification_status DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_status ON notification_history(status);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX idx_notification_history_type ON notification_history(notification_type);

-- RLS Policies
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification history
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (Edge Functions)
-- Note: Edge Functions use service_role key which bypasses RLS

-- =====================================================
-- 3. HELPER FUNCTION FOR UPDATED_AT
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for push_tokens
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE push_tokens IS 'Stores FCM tokens for push notifications on iOS and Android devices';
COMMENT ON COLUMN push_tokens.token IS 'FCM registration token from Firebase';
COMMENT ON COLUMN push_tokens.platform IS 'Device platform: ios or android';
COMMENT ON COLUMN push_tokens.preferences IS 'User notification preferences (which types to receive, quiet hours, etc.)';
COMMENT ON COLUMN push_tokens.is_active IS 'Whether this token is still valid and should receive notifications';

COMMENT ON TABLE notification_history IS 'Tracks all push notifications sent to users';
COMMENT ON COLUMN notification_history.notification_type IS 'Type of notification sent';
COMMENT ON COLUMN notification_history.status IS 'Current status: sent, delivered, clicked, or failed';
COMMENT ON COLUMN notification_history.data IS 'Additional payload data sent with the notification';
