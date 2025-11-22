/*
  # Add Username to Profiles

  1. Changes
    - Add `username` field to profiles table
    - Set unique constraint on username
    - Update trigger to auto-generate username
    - Create function to generate unique username from email/name

  2. Security
    - Maintain existing RLS policies
    - Username is unique and indexed for fast lookups

  3. Important Notes
    - Username is generated automatically on user creation
    - Format: firstname_lastname_random4digits or email_random4digits
    - Existing users without username will get one on next profile update
*/

-- Add username column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username text;
  END IF;
END $$;

-- Create unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Function to generate unique username
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_name text, user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_candidate text;
  random_suffix text;
  counter integer := 0;
BEGIN
  -- Clean base name: remove spaces, special chars, lowercase
  base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '_', 'g'));
  base_name := regexp_replace(base_name, '_+', '_', 'g');
  base_name := trim(both '_' from base_name);

  -- If base_name is empty, use email prefix
  IF base_name = '' OR base_name IS NULL THEN
    base_name := lower(split_part(user_email, '@', 1));
    base_name := regexp_replace(base_name, '[^a-zA-Z0-9]', '_', 'g');
  END IF;

  -- Limit length
  IF length(base_name) > 20 THEN
    base_name := substring(base_name, 1, 20);
  END IF;

  -- Try to find unique username
  LOOP
    -- Generate random 4-digit suffix
    random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
    username_candidate := base_name || '_' || random_suffix;

    -- Check if username exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = username_candidate) THEN
      RETURN username_candidate;
    END IF;

    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback: use UUID substring if we can't find unique username
      RETURN base_name || '_' || substring(gen_random_uuid()::text, 1, 8);
    END IF;
  END LOOP;
END;
$$;

-- Update handle_new_user to generate username
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_avatar_url TEXT;
  user_name TEXT;
  user_username TEXT;
BEGIN
  -- Try to get avatar from OAuth provider (Google, GitHub, etc.)
  user_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E'
  );

  -- Get user name
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Generate unique username
  user_username := public.generate_unique_username(user_name, NEW.email);

  INSERT INTO public.profiles (
    id,
    email,
    name,
    username,
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
    user_name,
    user_username,
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

-- Generate usernames for existing users without one
UPDATE public.profiles
SET username = public.generate_unique_username(name, email)
WHERE username IS NULL;
