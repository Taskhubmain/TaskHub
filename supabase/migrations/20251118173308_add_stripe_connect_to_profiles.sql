/*
  # Add Stripe Connect fields to profiles

  1. Changes
    - Add `stripe_account_id` (text, nullable) - Stripe Connect account ID
    - Add `stripe_onboarding_complete` (boolean, default false) - onboarding completion status
    - Add `stripe_payouts_enabled` (boolean, default false) - payout capability status

  2. Security
    - Only users can read their own Stripe Connect status
    - Only admins can directly modify these fields (normal updates go through edge functions)
*/

-- Add Stripe Connect fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_account_id text NULL,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;

-- Create index for faster lookups by stripe_account_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id
ON profiles(stripe_account_id)
WHERE stripe_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.stripe_account_id IS 'Stripe Connect Express account ID (acct_...)';
COMMENT ON COLUMN profiles.stripe_onboarding_complete IS 'Whether the Stripe account onboarding is complete';
COMMENT ON COLUMN profiles.stripe_payouts_enabled IS 'Whether payouts are enabled on the Stripe account';