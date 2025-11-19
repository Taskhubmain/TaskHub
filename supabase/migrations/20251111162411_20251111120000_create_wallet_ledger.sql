/*
  # Create wallet_ledger table for Stripe wallet system

  1. New Tables
    - `wallet_ledger`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, not null, references auth.users)
      - `kind` (text, not null, 'deposit' or 'withdraw')
      - `status` (text, not null, 'pending', 'processing', 'succeeded', 'failed', 'canceled')
      - `amount_minor` (bigint, not null, amount in cents/minor units)
      - `currency` (text, default 'usd')
      - `stripe_pi_id` (text, unique, Stripe PaymentIntent ID)
      - `metadata` (jsonb, default '{}')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `wallet_ledger` table
    - Users can read only their own records
    - Users can insert only their own deposits with pending status
    - Only service role can update records (via Edge Functions)

  3. Indexes
    - Index on user_id for fast lookups
    - Unique index on stripe_pi_id for idempotency
    - Index on status for filtering
*/

-- Create wallet_ledger table
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deposit', 'withdraw')),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'usd',
  stripe_pi_id text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own records
CREATE POLICY "Users can read own wallet ledger"
  ON wallet_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert only their own deposits with pending status
CREATE POLICY "Users can insert own deposits"
  ON wallet_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND kind = 'deposit'
    AND status = 'pending'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_status ON wallet_ledger(status);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_stripe_pi_id ON wallet_ledger(stripe_pi_id) WHERE stripe_pi_id IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_wallet_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_ledger_updated_at
  BEFORE UPDATE ON wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_ledger_updated_at();
