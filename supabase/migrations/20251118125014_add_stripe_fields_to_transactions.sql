/*
  # Add Stripe Integration Fields to Transactions

  1. Changes
    - Add `provider` field (default 'stripe') to track payment provider
    - Add `provider_payment_id` field to store Stripe payment intent or session ID
    - Add `provider_status` field to store Stripe payment status
  
  2. Security
    - No RLS changes needed (existing policies apply)
*/

-- Add Stripe-related fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'provider'
  ) THEN
    ALTER TABLE transactions ADD COLUMN provider text DEFAULT 'stripe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'provider_payment_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN provider_payment_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'provider_status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN provider_status text;
  END IF;
END $$;

-- Create index for faster Stripe payment lookups
CREATE INDEX IF NOT EXISTS idx_transactions_provider_payment_id ON transactions(provider_payment_id);