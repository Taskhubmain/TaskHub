/*
  # Add policy for order/task owners to update proposals

  1. Changes
    - Add UPDATE policy for proposals allowing order/task owners to update status
    - This enables accepting/rejecting proposals

  2. Security
    - Only owners of the related order or task can update
    - Authenticated users only
*/

-- Drop existing update policy to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;

-- Recreate policy for proposal authors to update their own proposals
CREATE POLICY "Users can update their own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add policy for order/task owners to update proposals (accept/reject)
CREATE POLICY "Order/task owners can update proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = proposals.order_id
      AND orders.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = proposals.order_id
      AND orders.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
      AND tasks.user_id = auth.uid()
    )
  );