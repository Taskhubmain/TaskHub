/*
  # Add age field to profiles

  1. Changes
    - Add `age` column to profiles table for storing user age
    - Field is optional (nullable) for privacy

  2. Security
    - No policy changes needed, inherits existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;
END $$;