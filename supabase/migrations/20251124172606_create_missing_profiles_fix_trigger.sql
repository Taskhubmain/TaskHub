/*
  # Create Missing Profiles and Fix Ledger Trigger

  1. Changes
    - Temporarily disable ledger trigger
    - Create profiles for users without them
    - Re-enable ledger trigger with better error handling
    
  2. Security
    - Maintain all RLS policies
    - Safe profile creation
*/

-- =============================================
-- 1. TEMPORARILY DISABLE PROBLEMATIC TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS create_ledger_on_profile ON public.profiles;

-- =============================================
-- 2. CREATE PROFILES FOR USERS WITHOUT THEM
-- =============================================

-- Insert profiles for users who don't have them
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
  avatar_url,
  profile_completed
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as name,
  COALESCE(u.raw_user_meta_data->>'role', 'FREELANCER') as role,
  'не указана' as specialty,
  0 as experience_years,
  ARRAY['не указаны'] as skills,
  'не указана' as location,
  'не указан' as contact_telegram,
  'не указан' as contact_gmail,
  'Привет! Я использую TaskHub' as bio,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E'
  ) as avatar_url,
  false as profile_completed
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. FIX LEDGER TRIGGER WITH BETTER ERROR HANDLING
-- =============================================

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.create_default_ledger_accounts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path TO public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if ledger_accounts table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ledger_accounts'
  ) THEN
    -- Create ledger accounts if table exists
    INSERT INTO ledger_accounts (user_id, kind, currency, balance_cents)
    VALUES 
    (NEW.id, 'available', 'USD', 0),
    (NEW.id, 'escrow', 'USD', 0)
    ON CONFLICT (user_id, kind, currency) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the profile creation
    RAISE LOG 'Error creating ledger accounts for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER create_ledger_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_ledger_accounts();
