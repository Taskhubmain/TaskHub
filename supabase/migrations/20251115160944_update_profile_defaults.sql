/*
  # Update Profile Creation with Default Values

  ## Overview
  Updates the profile creation trigger to set default placeholder values:
  - name: from email or registration
  - specialty: "не указана"
  - experience_years: 0
  - skills: ["не указаны"]
  - location: "не указана"
  - contact_telegram: "не указан"
  - contact_gmail: "не указан"
  - bio: "Привет! Я использую TaskHub"

  ## Changes
  - Updates handle_new_user() function to include default values
  - Ensures new users have proper placeholder data
*/

-- Drop and recreate the trigger function with default values
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    bio
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'FREELANCER'),
    'не указана',
    0,
    ARRAY['не указаны'],
    'не указана',
    'не указан',
    'не указан',
    'Привет! Я использую TaskHub'
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
