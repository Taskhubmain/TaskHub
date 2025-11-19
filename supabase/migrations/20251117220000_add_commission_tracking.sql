/*
  # Add Commission Tracking to Deals

  1. Changes
    - Add `is_boosted` to deals table (default: false)
    - Add `platform_commission_rate` to deals (15% or 25%)
    - Add `platform_commission_amount` for actual commission
    - Add `freelancer_payout_amount` for what freelancer receives

  2. Notes
    - Without boost: 15% commission, freelancer gets 85%
    - With boost: 25% commission, freelancer gets 75%
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'is_boosted'
  ) THEN
    ALTER TABLE deals ADD COLUMN is_boosted boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'platform_commission_rate'
  ) THEN
    ALTER TABLE deals ADD COLUMN platform_commission_rate numeric(5,2) DEFAULT 15.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'platform_commission_amount'
  ) THEN
    ALTER TABLE deals ADD COLUMN platform_commission_amount numeric(12,2) DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'freelancer_payout_amount'
  ) THEN
    ALTER TABLE deals ADD COLUMN freelancer_payout_amount numeric(12,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_is_boosted ON deals(is_boosted);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
