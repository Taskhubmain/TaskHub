/*
  # Update profiles RLS policy for balance updates

  1. Changes
    - Allow users to update their own profile balance
    - Ensure users can only update their own balance
  
  2. Security
    - Users can only modify their own profile balance
    - Balance constraint (non-negative) is enforced at database level
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new update policy that allows balance updates
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);