/*
  # Add Mute Duration Field

  1. Changes
    - Add `muted_until` column to `profiles` table to store mute expiration time

  2. Notes
    - When `muted_until` is null and `is_muted` is true, the mute is permanent
    - When `muted_until` is set, the mute expires at that time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_until timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_muted_until ON profiles(muted_until) WHERE muted_until IS NOT NULL;
