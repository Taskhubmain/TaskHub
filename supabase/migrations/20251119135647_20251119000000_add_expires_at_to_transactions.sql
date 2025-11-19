/*
  # Add expires_at field to transactions

  1. Changes
    - Add `expires_at` column to `transactions` table
      - Type: timestamptz (nullable)
      - Purpose: Track when pending deposits should expire (20 minutes after creation)

  2. Performance
    - Add composite index on (type, status, expires_at) for efficient expired deposit queries

  3. Notes
    - This field is primarily used for deposit transactions
    - Cleanup process will update status to 'expired' when expires_at < now()
    - Late Stripe payments can still complete even after expiration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_expiration
  ON transactions(type, status, expires_at)
  WHERE type = 'deposit' AND status = 'pending' AND expires_at IS NOT NULL;
