/*
  # Fix Wallet Ledger INSERT Policy for Subscriptions

  1. Changes
    - Update INSERT policy for `wallet_ledger` to allow users to create purchase records
    - Users can now insert records with `kind = 'purchase'` and `status = 'completed'`
    - Maintains existing permission for deposits

  2. Security
    - Users can only insert their own records (auth.uid() = user_id)
    - Allowed operations:
      - Deposits: kind = 'deposit', status = 'pending'
      - Purchases: kind = 'purchase', status = 'completed'
*/

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can insert own deposits" ON wallet_ledger;

-- Create new policy that allows both deposits and purchases
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
      -- Allow purchases with completed status (for subscriptions, etc)
      (kind = 'purchase' AND status = 'completed')
    )
  );
