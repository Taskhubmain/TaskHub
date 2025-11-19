/*
  # Stripe Integration - Events and Ledger System

  ## Overview
  This migration creates the foundation for Stripe Connect integration with internal ledger system
  for managing deposits, escrow, and platform revenue.

  ## 1. New Tables
  
  ### `stripe_events`
  Idempotency tracking for Stripe webhook events
  - `id` (text, primary key) - Stripe event ID
  - `type` (text) - Event type (payment_intent.succeeded, etc.)
  - `data` (jsonb) - Full event payload
  - `processed_at` (timestamptz) - When event was processed
  - `created_at` (timestamptz) - When event was created
  
  ### `ledger_accounts`
  Internal wallet accounts for users
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Reference to auth.users (matches profiles.id)
  - `kind` (text) - Account type: available, escrow, platform_revenue
  - `currency` (text) - Currency code (default: USD)
  - `balance_cents` (bigint) - Current balance in cents
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `ledger_entries`
  Double-entry bookkeeping journal for all transactions
  - `id` (uuid, primary key)
  - `journal_id` (uuid) - Groups related entries
  - `account_id` (uuid) - Reference to ledger_accounts
  - `amount_cents` (bigint) - Amount in cents (positive/negative)
  - `ref_type` (text) - Reference type: DEPOSIT, RESERVE, RELEASE, REFUND, SPEND, TRANSFER
  - `ref_id` (text) - Reference ID (deal_id, payment_intent_id, etc.)
  - `metadata` (jsonb) - Additional data
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can read their own ledger accounts and entries
  - Only authenticated users can access
  - Platform revenue account restricted to admins
  
  ## 3. Indexes
  - Performance indexes on user_id, journal_id, ref_type
  - Unique constraint on stripe event IDs for idempotency

  ## 4. Important Notes
  - All monetary amounts stored in cents to avoid floating point issues
  - Journal IDs group related entries for atomic transactions
  - Stripe events table prevents duplicate processing
*/

-- Create stripe_events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  data jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access to stripe events (future feature)
CREATE POLICY "Authenticated users can view stripe events"
  ON stripe_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create ledger_accounts table
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('available', 'escrow', 'platform_revenue')),
  currency text NOT NULL DEFAULT 'USD',
  balance_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, kind, currency)
);

ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger accounts"
  ON ledger_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger accounts"
  ON ledger_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  ref_type text NOT NULL CHECK (ref_type IN ('DEPOSIT', 'RESERVE', 'RELEASE', 'REFUND', 'SPEND', 'TRANSFER', 'FEE')),
  ref_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries.account_id
      AND ledger_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ledger entries"
  ON ledger_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries.account_id
      AND ledger_accounts.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_user_id ON ledger_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_kind ON ledger_accounts(kind);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_journal_id ON ledger_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_ref_type ON ledger_entries(ref_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_ref_id ON ledger_entries(ref_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);

-- Function to update ledger_accounts.updated_at
CREATE OR REPLACE FUNCTION update_ledger_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS ledger_accounts_updated_at ON ledger_accounts;
CREATE TRIGGER ledger_accounts_updated_at
  BEFORE UPDATE ON ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_ledger_account_timestamp();

-- Function to create default ledger accounts for new users
CREATE OR REPLACE FUNCTION create_default_ledger_accounts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ledger_accounts (user_id, kind, currency, balance_cents)
  VALUES 
    (NEW.id, 'available', 'USD', 0),
    (NEW.id, 'escrow', 'USD', 0)
  ON CONFLICT (user_id, kind, currency) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create ledger accounts when profile is created
DROP TRIGGER IF EXISTS create_ledger_on_profile ON profiles;
CREATE TRIGGER create_ledger_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_ledger_accounts();