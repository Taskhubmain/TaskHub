/*
  # Add UPDATE policy for transactions table

  1. Changes
    - Add UPDATE policy for transactions table to allow service role updates
    - Allows authenticated users to update their own transactions
    - Allows system to update transaction status (expired, completed, etc.)

  2. Security
    - Users can only update their own transactions (via wallet ownership)
    - Service role can update any transaction (for system operations)
*/

-- Allow users to update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
