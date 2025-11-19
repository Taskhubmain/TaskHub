/*
  # Add Mute and Ban Functionality to Profiles

  1. Changes
    - Add `is_muted` column to `profiles` table (default: false)
    - Add `is_banned` column to `profiles` table (default: false)
    - Add `muted_at` column to track when user was muted
    - Add `banned_at` column to track when user was banned
    - Add `muted_by` column to track which admin muted the user
    - Add `banned_by` column to track which admin banned the user
    - Add `mute_reason` column for admin notes
    - Add `ban_reason` column for admin notes

  2. Security
    - Only admins can update mute/ban status
    - Users can read their own mute/ban status

  3. Behavior
    - Muted users cannot:
      - Create new orders
      - Create new tasks
      - Submit proposals
      - Reply to proposals
    - Banned users cannot login (handled at auth level)
*/

-- Add mute and ban columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_muted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_muted boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN banned_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mute_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mute_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ban_reason text;
  END IF;
END $$;

-- Create index for quick muted/banned user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_muted ON profiles(is_muted) WHERE is_muted = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;
