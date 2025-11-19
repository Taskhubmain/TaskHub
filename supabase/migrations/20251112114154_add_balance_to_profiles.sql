/*
  # Add balance field to profiles table

  1. Changes
    - Add `balance` column to profiles table (numeric with 2 decimal places)
    - Set default value to 0.00
    - Add check constraint to ensure balance cannot be negative
  
  2. Security
    - Balance is protected by existing RLS policies
    - Only profile owner can view their balance
    - Updates to balance require special handling (will be done through secure functions)
*/

-- Add balance column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;
    ALTER TABLE profiles ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
  END IF;
END $$;