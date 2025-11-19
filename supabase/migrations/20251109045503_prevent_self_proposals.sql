/*
  # Prevent Self Proposals

  1. Changes
    - Update RLS policy to prevent users from submitting proposals to their own orders/tasks

  2. Security
    - Users cannot create proposals for their own orders
    - Users cannot create proposals for their own tasks
    - Enforced at database level via RLS policy
*/

-- Drop existing insert policy to recreate with self-proposal prevention
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;

-- Recreate insert policy with self-proposal check
CREATE POLICY "Users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (order_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM orders WHERE orders.id = proposals.order_id AND orders.user_id = auth.uid()
      ))
      OR
      (task_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tasks WHERE tasks.id = proposals.task_id AND tasks.user_id = auth.uid()
      ))
    )
  );
