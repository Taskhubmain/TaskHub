/*
  # Cleanup Duplicate RLS Policies

  1. Changes
    - Remove duplicate "Anyone can view active orders" policy
    - Remove duplicate "Anyone can view active tasks" policy
    - Keep only the newer policies created in the fix migration

  2. Security
    - No security changes, just removing duplicates
    - All tables remain protected with RLS
*/

-- Remove old duplicate policy for orders
DROP POLICY IF EXISTS "Anyone can view active orders" ON orders;

-- Remove old duplicate policy for tasks  
DROP POLICY IF EXISTS "Anyone can view active tasks" ON tasks;
