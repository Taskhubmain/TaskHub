/*
  # Optimize RLS Policies - Part 5: Chat CRM and Proposals

  1. Changes
    - Optimize auth.uid() calls in chat_crm_context, crm_pending_confirmations, proposals
*/

-- Chat CRM context: Drop old policies
DROP POLICY IF EXISTS "Chat participants can view CRM context" ON chat_crm_context;
DROP POLICY IF EXISTS "Chat participants can update CRM context" ON chat_crm_context;
DROP POLICY IF EXISTS "Chat participants can insert CRM context" ON chat_crm_context;
DROP POLICY IF EXISTS "Chat participants can delete CRM context" ON chat_crm_context;

-- Chat CRM context: Recreate with optimized policies
CREATE POLICY "Chat participants can view CRM context"
  ON chat_crm_context
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

CREATE POLICY "Chat participants can update CRM context"
  ON chat_crm_context
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

CREATE POLICY "Chat participants can insert CRM context"
  ON chat_crm_context
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

CREATE POLICY "Chat participants can delete CRM context"
  ON chat_crm_context
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

-- CRM pending confirmations: Drop old policies
DROP POLICY IF EXISTS "Users can view confirmations in their chats" ON crm_pending_confirmations;
DROP POLICY IF EXISTS "Users can update confirmations in their chats" ON crm_pending_confirmations;

-- CRM pending confirmations: Recreate with optimized policies
CREATE POLICY "Users can view confirmations in their chats"
  ON crm_pending_confirmations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = crm_pending_confirmations.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

CREATE POLICY "Users can update confirmations in their chats"
  ON crm_pending_confirmations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = crm_pending_confirmations.chat_id
      AND ((select auth.uid())::text = chats.participant1_id OR (select auth.uid())::text = chats.participant2_id)
    )
  );

-- Proposals: Drop old policies
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can view proposals on their orders/tasks" ON proposals;

-- Proposals: Recreate with optimized policies
CREATE POLICY "Users can view their own proposals"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (freelancer_id = (select auth.uid()));

CREATE POLICY "Users can update their own proposals"
  ON proposals
  FOR UPDATE
  TO authenticated
  USING (freelancer_id = (select auth.uid()))
  WITH CHECK (freelancer_id = (select auth.uid()));

CREATE POLICY "Users can create proposals"
  ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (freelancer_id = (select auth.uid()));

CREATE POLICY "Users can delete their own proposals"
  ON proposals
  FOR DELETE
  TO authenticated
  USING (freelancer_id = (select auth.uid()));

CREATE POLICY "Users can view proposals on their orders/tasks"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = proposals.order_id AND orders.user_id = (select auth.uid())
      UNION
      SELECT 1 FROM tasks WHERE tasks.id = proposals.task_id AND tasks.user_id = (select auth.uid())
    )
  );
