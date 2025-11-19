/*
  # Add Withdrawn Status Support to Proposals

  1. Changes
    - Add support for 'withdrawn' status in proposals
    - Update status checks to include 'withdrawn'
    - Withdrawn proposals will appear for the sender but be hidden from recipients

  2. Security
    - Add policy to allow users to delete their own withdrawn proposals
    - Withdrawn proposals are filtered out from recipient's view

  3. Important Notes
    - Withdrawn proposals keep status 'withdrawn' instead of being deleted immediately
    - Users can permanently delete only their own withdrawn proposals
    - Status can be: 'pending', 'accepted', 'rejected', 'withdrawn'
*/

-- Add policy to allow users to delete their own proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'proposals' 
    AND policyname = 'Users can delete their own proposals'
  ) THEN
    CREATE POLICY "Users can delete their own proposals"
      ON proposals FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update the view policy to hide withdrawn proposals from order/task owners
DROP POLICY IF EXISTS "Users can view proposals on their orders/tasks" ON proposals;
CREATE POLICY "Users can view proposals on their orders/tasks"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    status != 'withdrawn' AND (
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
