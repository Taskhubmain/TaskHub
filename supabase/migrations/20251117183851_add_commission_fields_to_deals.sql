/*
  # Add Commission Tracking Fields to Deals Table

  1. Changes
    - Add `is_boosted` boolean field to track if deal has promotion
    - Add `platform_commission_rate` numeric field to store commission percentage
    - Add `platform_commission_amount` numeric field to store commission amount in currency
    - Add `freelancer_payout_amount` numeric field to store freelancer payout in currency

  2. Notes
    - These fields are populated when escrow is released
    - is_boosted is set from the order/task boost status when deal is created
*/

-- Add commission tracking fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS platform_commission_rate numeric DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS platform_commission_amount numeric DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS freelancer_payout_amount numeric DEFAULT 0;

-- Create index for querying boosted deals
CREATE INDEX IF NOT EXISTS idx_deals_is_boosted ON deals(is_boosted);
