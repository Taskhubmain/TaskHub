/*
  # Fix Wallet Ledger Purchase Policy

  1. Changes
    - Update INSERT policy for `wallet_ledger` to allow `status = 'succeeded'` for purchases
    - Previous policy only allowed `status = 'completed'` which doesn't exist in the check constraint
    - Correct status for successful transactions is 'succeeded'

  2. Security
    - Users can only insert their own records (auth.uid() = user_id)
    - Allowed operations:
      - Deposits: kind = 'deposit', status = 'pending'
      - Purchases: kind = 'purchase', status = 'succeeded'
*/

-- Drop old policy
DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON wallet_ledger;

-- Create updated policy with correct status for purchases
CREATE POLICY "Users can insert own wallet transactions"
  ON wallet_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Allow deposits with pending status
      (kind = 'deposit' AND status = 'pending')
      OR
      -- Allow purchases with succeeded status (correct status for completed transactions)
      (kind = 'purchase' AND status = 'succeeded')
    )
  );
