/*
  # Add proposal rejection policy for order/task owners

  1. Changes
    - Add new UPDATE policy allowing order/task owners to reject proposals
    - This allows clients to change proposal status to 'rejected'
    
  2. Security
    - Only allows changing status to 'rejected'
    - Only for owners of the order/task
    - Maintains existing security model
*/

-- Allow order/task owners to reject proposals
CREATE POLICY "Order/task owners can reject proposals"
  ON proposals
  FOR UPDATE
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
    status = 'rejected' AND (
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
  );
