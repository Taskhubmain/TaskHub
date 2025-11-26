/*
  # Fix proposals SELECT policy

  1. Changes
    - Drop incorrect policy that references non-existent freelancer_id column
    - Recreate policy using correct user_id column
    
  2. Security
    - Users can view their own proposals (where they are the author)
    - Maintains existing security model
*/

-- Drop incorrect policy
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;

-- Recreate with correct column name
CREATE POLICY "Users can view their own proposals"
  ON proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
