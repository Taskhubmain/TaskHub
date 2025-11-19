/*
  # Fix UPDATE policies for orders and tasks

  1. Changes
    - Drop existing UPDATE policies
    - Create new UPDATE policies without WITH CHECK restrictions
    - Allow users to update all fields in their own orders and tasks

  2. Security
    - Users can only update their own orders/tasks (USING clause)
    - No restrictions on what fields can be updated (removed WITH CHECK)
*/

-- Drop and recreate orders UPDATE policy
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop and recreate tasks UPDATE policy
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
