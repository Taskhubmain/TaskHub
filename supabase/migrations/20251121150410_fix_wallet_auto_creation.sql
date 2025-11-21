/*
  # Fix automatic wallet creation for new users

  1. Changes
    - Update `create_wallet_for_new_user` function with proper search_path
    - Add trigger on auth.users to create wallet immediately on registration
    - Create wallets for any existing users without wallets

  2. Security
    - Function uses SECURITY DEFINER to create wallets in public schema
    - Ensures every user gets a wallet automatically
*/

-- Drop existing trigger on profiles if exists
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert wallet for new user if not exists
  INSERT INTO public.wallets (user_id, balance, pending_balance, total_earned, total_withdrawn, currency)
  VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'USD')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to create wallet immediately on registration
DROP TRIGGER IF EXISTS create_wallet_on_user_signup ON auth.users;
CREATE TRIGGER create_wallet_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Also keep trigger on profiles for backward compatibility
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Create wallets for any existing users without wallets
INSERT INTO public.wallets (user_id, balance, pending_balance, total_earned, total_withdrawn, currency)
SELECT id, 0.00, 0.00, 0.00, 0.00, 'USD' 
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;
