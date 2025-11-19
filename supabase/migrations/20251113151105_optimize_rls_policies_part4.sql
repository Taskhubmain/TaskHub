/*
  # Optimize RLS Policies - Part 4: Wallet and Transactions

  1. Changes
    - Optimize auth.uid() calls in wallets, transactions, typing_indicators
*/

-- Typing indicators: Drop old policies
DROP POLICY IF EXISTS "Users can manage own typing status" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing in their chats" ON typing_indicators;

-- Typing indicators: Recreate with optimized policies
CREATE POLICY "Users can manage own typing status"
  ON typing_indicators
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view typing in their chats"
  ON typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = typing_indicators.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

-- Wallets: Drop old policies
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;

-- Wallets: Recreate with optimized policies
CREATE POLICY "Users can view own wallet"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own wallet"
  ON wallets
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Transactions: Drop old policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Transactions: Recreate with optimized policies
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
