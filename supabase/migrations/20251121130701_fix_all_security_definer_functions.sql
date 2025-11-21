/*
  # Fix all SECURITY DEFINER functions with schema references

  1. Changes
    - Fix `calculate_user_unread_count` to use explicit schema references
    - Fix `lock_funds_in_escrow` to use explicit schema references
    - Fix `release_escrow_to_freelancer` to use explicit schema references

  2. Notes
    - Using explicit schema references ensures functions work correctly with SECURITY DEFINER
    - Setting search_path to empty string prevents search_path injection attacks
*/

-- Fix calculate_user_unread_count function
CREATE OR REPLACE FUNCTION public.calculate_user_unread_count(p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  total_unread integer;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN participant1_id = p_user_id THEN unread_count_p1
      WHEN participant2_id = p_user_id THEN unread_count_p2
      ELSE 0
    END
  ), 0)
  INTO total_unread
  FROM public.chats
  WHERE participant1_id = p_user_id OR participant2_id = p_user_id;

  RETURN total_unread;
END;
$$;

-- Fix lock_funds_in_escrow function
CREATE OR REPLACE FUNCTION public.lock_funds_in_escrow(
  p_deal_id uuid, 
  p_client_id uuid, 
  p_amount_minor bigint, 
  p_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_client_balance NUMERIC;
  v_amount_decimal NUMERIC;
BEGIN
  -- Convert minor units to decimal (cents to dollars)
  v_amount_decimal := p_amount_minor / 100.0;

  -- Check client's balance
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

  -- Deduct from client balance
  UPDATE public.profiles
  SET balance = balance - v_amount_decimal
  WHERE id = p_client_id;

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

-- Fix release_escrow_to_freelancer function
CREATE OR REPLACE FUNCTION public.release_escrow_to_freelancer(p_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_deal RECORD;
  v_amount_decimal NUMERIC;
BEGIN
  -- Get deal details
  SELECT 
    escrow_amount,
    escrow_currency,
    freelancer_id,
    client_id,
    status,
    escrow_released_at
  INTO v_deal
  FROM public.deals
  WHERE id = p_deal_id;

  IF v_deal IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deal not found'
    );
  END IF;

  IF v_deal.status != 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deal is not completed'
    );
  END IF;

  IF v_deal.escrow_released_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Escrow already released'
    );
  END IF;

  IF v_deal.escrow_amount IS NULL OR v_deal.escrow_amount = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No escrow amount to release'
    );
  END IF;

  -- Convert to decimal
  v_amount_decimal := v_deal.escrow_amount / 100.0;

  -- Add to freelancer balance
  UPDATE public.profiles
  SET balance = balance + v_amount_decimal
  WHERE id = v_deal.freelancer_id;

  -- Mark escrow as released
  UPDATE public.deals
  SET escrow_released_at = NOW()
  WHERE id = p_deal_id;

  -- Create ledger entry for freelancer (credit)
  INSERT INTO public.wallet_ledger (
    user_id,
    kind,
    status,
    amount_minor,
    currency,
    metadata
  ) VALUES (
    v_deal.freelancer_id,
    'escrow_release',
    'completed',
    v_deal.escrow_amount,
    v_deal.escrow_currency,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'client_id', v_deal.client_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'released_amount', v_amount_decimal,
    'freelancer_id', v_deal.freelancer_id,
    'new_balance', (SELECT balance FROM public.profiles WHERE id = v_deal.freelancer_id)
  );
END;
$$;
