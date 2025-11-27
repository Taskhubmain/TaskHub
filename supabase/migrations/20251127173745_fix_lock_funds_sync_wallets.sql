/*
  # Fix lock_funds_in_escrow to synchronize wallets table

  1. Changes
    - Update lock_funds_in_escrow function to also update wallets.balance
    - Ensure profiles.balance and wallets.balance remain synchronized
  
  2. Why This Is Important
    - profiles.balance is the source of truth displayed in UI
    - wallets.balance must be kept in sync for consistency
    - Prevents race conditions and display bugs where balances don't match
  
  3. Security
    - Maintains SECURITY DEFINER with proper search_path
    - All operations remain atomic within the function
*/

CREATE OR REPLACE FUNCTION public.lock_funds_in_escrow(
  p_deal_id uuid, 
  p_client_id uuid, 
  p_amount_minor bigint, 
  p_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_balance NUMERIC;
  v_amount_decimal NUMERIC;
BEGIN
  -- Convert minor units to decimal (cents to dollars)
  v_amount_decimal := p_amount_minor / 100.0;

  -- Check client's balance from profiles (source of truth)
  SELECT balance INTO v_client_balance
  FROM public.profiles
  WHERE id = p_client_id;

  IF v_client_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Client profile not found'
    );
  END IF;

  IF v_client_balance < v_amount_decimal THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'required', v_amount_decimal,
      'available', v_client_balance
    );
  END IF;

  -- Deduct from client balance in profiles
  UPDATE public.profiles
  SET balance = balance - v_amount_decimal
  WHERE id = p_client_id;

  -- Also update wallets table to keep in sync
  UPDATE public.wallets
  SET 
    balance = balance - v_amount_decimal,
    updated_at = NOW()
  WHERE user_id = p_client_id;

  -- Store in escrow
  UPDATE public.deals
  SET 
    escrow_amount = p_amount_minor,
    escrow_currency = p_currency
  WHERE id = p_deal_id;

  -- Create ledger entry
  INSERT INTO public.wallet_ledger (
    user_id,
    kind,
    status,
    amount_minor,
    currency,
    metadata
  ) VALUES (
    p_client_id,
    'escrow_lock',
    'completed',
    -p_amount_minor,
    p_currency,
    jsonb_build_object('deal_id', p_deal_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'locked_amount', v_amount_decimal,
    'new_balance', (SELECT balance FROM public.profiles WHERE id = p_client_id)
  );
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.lock_funds_in_escrow TO authenticated;