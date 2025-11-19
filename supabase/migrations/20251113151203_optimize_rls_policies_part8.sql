/*
  # Optimize RLS Policies - Part 8: Wallet Ledger, Chats, and Messages

  1. Changes
    - Optimize auth.uid() calls in wallet_ledger, chats, messages
*/

-- Wallet ledger: Drop old policies
DROP POLICY IF EXISTS "Users can read own wallet ledger" ON wallet_ledger;
DROP POLICY IF EXISTS "Users can insert own deposits" ON wallet_ledger;
DROP POLICY IF EXISTS "user_reads_own_ledger" ON wallet_ledger;

-- Wallet ledger: Recreate with optimized policies
CREATE POLICY "Users can read own wallet ledger"
  ON wallet_ledger
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own deposits"
  ON wallet_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND entry_type = 'deposit');

-- Chats: Drop old policies
DROP POLICY IF EXISTS "chats_read_own" ON chats;
DROP POLICY IF EXISTS "chats_insert_own" ON chats;
DROP POLICY IF EXISTS "chats_update_own" ON chats;

-- Chats: Recreate with optimized policies
CREATE POLICY "chats_read_own"
  ON chats
  FOR SELECT
  USING ((select auth.uid())::text = participant1_id OR (select auth.uid())::text = participant2_id);

CREATE POLICY "chats_insert_own"
  ON chats
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = participant1_id OR (select auth.uid())::text = participant2_id);

CREATE POLICY "chats_update_own"
  ON chats
  FOR UPDATE
  USING ((select auth.uid())::text = participant1_id OR (select auth.uid())::text = participant2_id)
  WITH CHECK ((select auth.uid())::text = participant1_id OR (select auth.uid())::text = participant2_id);

-- Messages: Drop old policies
DROP POLICY IF EXISTS "messages_read_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;

-- Messages: Recreate with optimized policies
CREATE POLICY "messages_read_own"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

CREATE POLICY "messages_insert_own"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = (select auth.uid())::text);
