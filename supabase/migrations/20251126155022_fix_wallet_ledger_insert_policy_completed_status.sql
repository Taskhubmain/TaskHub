/*
  # Fix wallet_ledger INSERT policy to allow 'completed' status

  1. Changes
    - Update INSERT policy to allow purchases with 'completed' status
    - Previously was set to 'succeeded' which is incorrect

  2. Security
    - Users can only insert their own records (auth.uid() = user_id)
    - Allowed operations:
      - Deposits: kind = 'deposit', status = 'pending'
      - Purchases: kind = 'purchase', status = 'completed'
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON wallet_ledger;

-- Create updated policy with correct status
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
      -- Allow purchases with completed status
      (kind = 'purchase' AND status = 'completed')
    )
  );
