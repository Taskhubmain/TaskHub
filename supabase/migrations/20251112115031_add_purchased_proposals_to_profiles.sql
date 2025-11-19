/*
  # Add purchased proposals tracking to profiles

  1. Changes
    - Add `purchased_proposals` column to profiles table
    - Set default value to 0
    - Add check constraint to ensure purchased_proposals cannot be negative
  
  2. Security
    - Protected by existing RLS policies
    - Only profile owner can view their purchased proposals
    - Updates require secure handling through functions
*/

-- Add purchased_proposals column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'purchased_proposals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN purchased_proposals INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE profiles ADD CONSTRAINT purchased_proposals_non_negative CHECK (purchased_proposals >= 0);
  END IF;
END $$;