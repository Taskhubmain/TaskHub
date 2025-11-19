/*
  # Create wallet and transactions system

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `balance` (decimal) - Current balance in USD
      - `pending_balance` (decimal) - Balance in pending transactions
      - `total_earned` (decimal) - Total earned all time
      - `total_withdrawn` (decimal) - Total withdrawn all time
      - `currency` (text) - Default USD
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `wallet_id` (uuid, foreign key to wallets)
      - `type` (text) - income, outcome, withdrawal, deposit, fee
      - `amount` (decimal) - Transaction amount
      - `status` (text) - pending, completed, failed, cancelled
      - `description` (text) - Transaction description
      - `reference_type` (text) - deal, order, task, withdrawal, deposit
      - `reference_id` (uuid) - ID of related entity
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can only access their own wallet
    - Users can only view their own transactions
  
  3. Functions
    - Function to create wallet on user registration
  
  4. Indexes
    - Index on user_id for wallets
    - Index on wallet_id and created_at for transactions
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance decimal(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  pending_balance decimal(10,2) DEFAULT 0.00 NOT NULL CHECK (pending_balance >= 0),
  total_earned decimal(10,2) DEFAULT 0.00 NOT NULL CHECK (total_earned >= 0),
  total_withdrawn decimal(10,2) DEFAULT 0.00 NOT NULL CHECK (total_withdrawn >= 0),
  currency text DEFAULT 'USD' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'outcome', 'withdrawal', 'deposit', 'fee')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text NOT NULL,
  reference_type text CHECK (reference_type IN ('deal', 'order', 'task', 'withdrawal', 'deposit', 'fee')),
  reference_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Wallets policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

-- Function to create wallet on profile creation
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when profile is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_wallet_on_profile_insert'
  ) THEN
    CREATE TRIGGER create_wallet_on_profile_insert
      AFTER INSERT ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION create_wallet_for_new_user();
  END IF;
END $$;

-- Create wallets for existing users
INSERT INTO wallets (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;
