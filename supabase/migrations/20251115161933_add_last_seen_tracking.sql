/*
  # Add Last Seen Tracking

  ## Overview
  Adds last_seen_at field to track user online status.

  ## New Fields
  - `last_seen_at` - Timestamp of last user activity (timestamptz)

  ## Notes
  - Defaults to current timestamp on profile creation
  - Updated by application when user is active
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing profiles to have current timestamp
UPDATE profiles SET last_seen_at = now() WHERE last_seen_at IS NULL;
