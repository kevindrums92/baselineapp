-- Migration: Create trusted_devices table for OTP skip on trusted devices
-- Created: 2026-01-23

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),

  -- Ensure unique device per user
  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_lookup ON trusted_devices(user_id, device_fingerprint);

-- Enable Row Level Security
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own trusted devices
CREATE POLICY "Users can view own trusted devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own trusted devices
CREATE POLICY "Users can insert own trusted devices"
  ON trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own trusted devices
CREATE POLICY "Users can update own trusted devices"
  ON trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own trusted devices
CREATE POLICY "Users can delete own trusted devices"
  ON trusted_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up expired trusted devices (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS void AS $$
BEGIN
  DELETE FROM trusted_devices
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE trusted_devices IS 'Stores trusted device fingerprints to skip OTP verification';
COMMENT ON COLUMN trusted_devices.device_fingerprint IS 'Unique device identifier from FingerprintJS';
COMMENT ON COLUMN trusted_devices.expires_at IS 'Device trust expires after 90 days by default';
