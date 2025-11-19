/*
  # Add Stripe Connect Account Support

  ## Overview
  Adds Stripe Connect account tracking to profiles table for seller onboarding.

  ## Changes
  
  ### Add columns to `profiles`
  - `stripe_account_id` (text, nullable) - Stripe Express Connect account ID
  - `stripe_charges_enabled` (boolean) - Can accept payments
  - `stripe_payouts_enabled` (boolean) - Can receive payouts
  - `stripe_onboarded_at` (timestamptz) - When onboarding completed

  ## Security
  - No policy changes needed, existing profile policies apply
  
  ## Important Notes
  - Only sellers who complete onboarding can receive transfers
  - Platform checks these flags before processing payouts
*/

-- Add Stripe Connect columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_charges_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_payouts_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_onboarded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_onboarded_at timestamptz;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;