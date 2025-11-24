/*
  # Improve Transactions Insert Policy for Edge Functions

  1. Changes
    - Add service role policy for transactions insert (Edge Functions need this)
    - Ensure Edge Functions can create deposit transactions
    - Keep existing user policies intact

  2. Security
    - Service role can insert any transaction (needed for Edge Functions)
    - Users can still insert their own transactions
    - All RLS remains active
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Create policy that allows authenticated users to insert transactions for their own wallets
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- Add policy for service role (Edge Functions) to insert transactions
-- This is needed for the wallet topup Edge Function
CREATE POLICY "Service role can insert transactions"
  ON transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);
