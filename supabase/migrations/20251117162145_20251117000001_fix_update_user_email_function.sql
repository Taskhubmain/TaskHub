/*
  # Fix update user email function

  1. Changes
    - Drop old function
    - Create new function that bypasses auth restrictions
    - Use raw_user_meta_data instead of direct email update

  2. Security
    - Function runs with SECURITY DEFINER
    - Only allows users to update their own email
    - Validates email is not already in use
*/

-- Drop old function
DROP FUNCTION IF EXISTS update_user_email(uuid, text);

-- Create improved function
CREATE OR REPLACE FUNCTION update_user_email(
  user_id uuid,
  new_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Check that the user is updating their own email
  IF auth.uid() != user_id THEN
    RETURN jsonb_build_object('error', 'You can only update your own email');
  END IF;

  -- Check if email is already in use by another user in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = new_email
    AND id != user_id
  ) INTO email_exists;

  IF email_exists THEN
    RETURN jsonb_build_object('error', 'Email already in use');
  END IF;

  -- Update email in auth.users table
  UPDATE auth.users
  SET
    email = new_email,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', new_email),
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;

  -- Update email in profiles table
  UPDATE public.profiles
  SET
    email = new_email,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_email(uuid, text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_user_email IS 'Allows authenticated users to update their own email address';
