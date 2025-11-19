/*
  # Add owner SELECT policies

  1. Changes
    - Add SELECT policies for users to view their own orders/tasks regardless of status
    - Existing policies allow anyone to view active/open items
    - New policies allow owners to view all their own items (including paused)

  2. Security
    - Users can view all their own orders and tasks
    - Public can only view active/open items
*/

-- Allow users to view their own orders regardless of status
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to view their own tasks regardless of status
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
