/*
  # Update Profile Creation to Use Google Avatar

  ## Overview
  Updates the profile creation trigger to use Google profile photo when available.
  Falls back to default SVG avatar if not provided.

  ## Changes
  - Checks for `avatar_url` in raw_user_meta_data (from Google OAuth)
  - Uses Google avatar if available, otherwise uses default SVG
  - Maintains backward compatibility with existing users
*/

-- Drop and recreate the trigger function with Google avatar support
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_avatar_url TEXT;
BEGIN
  -- Try to get avatar from OAuth provider (Google, GitHub, etc.)
  user_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E'
  );

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role,
    specialty,
    experience_years,
    skills,
    location,
    contact_telegram,
    contact_gmail,
    bio,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'FREELANCER'),
    'не указана',
    0,
    ARRAY['не указаны'],
    'не указана',
    'не указан',
    'не указан',
    'Привет! Я использую TaskHub',
    user_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
