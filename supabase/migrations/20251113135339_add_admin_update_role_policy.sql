/*
  # Add Admin Role Update Policy

  1. Changes
    - Add policy to allow admins to update user roles
    - Admins can update any profile's role field

  2. Security
    - Only users with role='ADMIN' can update roles
    - Maintains existing user self-update policy
*/

-- Policy: Admins can update user roles
CREATE POLICY "Admins can update user roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
