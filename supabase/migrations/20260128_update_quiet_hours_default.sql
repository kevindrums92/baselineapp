-- =====================================================
-- Update quiet hours default values
-- =====================================================
-- This migration updates existing push_tokens records to change
-- quiet hours default from 22:00-08:00/06:00 to 23:59-00:00
-- (minimal 1-minute window when disabled)

-- Update all records that still have the old default quiet hours values
UPDATE push_tokens
SET preferences = jsonb_set(
  jsonb_set(
    preferences,
    '{quiet_hours,start}',
    '"23:59"'::jsonb
  ),
  '{quiet_hours,end}',
  '"00:00"'::jsonb
)
WHERE
  -- Only update records that have the old default values
  (preferences->'quiet_hours'->>'start' = '22:00'
   AND (preferences->'quiet_hours'->>'end' = '08:00' OR preferences->'quiet_hours'->>'end' = '06:00'))
  -- And quiet hours are disabled (user hasn't configured them)
  AND (preferences->'quiet_hours'->>'enabled')::boolean = false;
