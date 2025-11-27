/*
  # Fix Wallet UPSERT in Escrow Functions

  1. Problem
    - UPDATE wallets will fail silently if user has no wallet record
    - This can happen for old users created before wallet triggers
    - Results in profiles.balance updating but wallets.balance not updating
  
  2. Solution
    - Change UPDATE to INSERT...ON CONFLICT DO UPDATE (UPSERT)
    - Ensures wallet record is created if missing
    - Keeps profiles.balance and wallets.balance synchronized
  
  3. Changes
    - Update release_escrow_to_freelancer to use UPSERT
    - Update lock_funds_in_escrow to use UPSERT
  
  4. Security
    - Maintains SECURITY DEFINER with proper search_path
    - All operations remain atomic
*/

-- Fix release_escrow_to_freelancer
CREATE OR REPLACE FUNCTION release_escrow_to_freelancer(
  p_deal_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_deal RECORD;
  v_amount_decimal NUMERIC;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_freelancer_payout NUMERIC;
BEGIN
  SELECT
    d.escrow_amount,
    d.escrow_currency,
    d.freelancer_id,
    d.client_id,
    d.status,
    d.escrow_released_at,
    d.is_boosted,
    d.price,
    d.order_id,
    d.task_id
  INTO v_deal
  FROM deals d
  WHERE d.id = p_deal_id;

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

  v_amount_decimal := v_deal.escrow_amount / 100.0;

  -- Simplified commission logic: based purely on is_boosted flag
  IF v_deal.is_boosted THEN
    -- Any boosted deal (Order or Task): 25% commission
    v_commission_rate := 0.25;
  ELSE
    -- Any regular deal (Order or Task): 15% commission
    v_commission_rate := 0.15;
  END IF;

  v_commission_amount := v_amount_decimal * v_commission_rate;
  v_freelancer_payout := v_amount_decimal - v_commission_amount;

  -- Update freelancer balance in profiles
  UPDATE profiles
  SET balance = balance + v_freelancer_payout
  WHERE id = v_deal.freelancer_id;

  -- UPSERT freelancer wallet (creates if missing, updates if exists)
  INSERT INTO wallets (user_id, balance, total_earned, updated_at)
  VALUES (
    v_deal.freelancer_id,
    v_freelancer_payout,
    v_freelancer_payout,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = wallets.balance + EXCLUDED.balance,
    total_earned = wallets.total_earned + EXCLUDED.total_earned,
    updated_at = NOW();

  -- Update deal with commission details
  UPDATE deals
  SET
    escrow_released_at = NOW(),
    platform_commission_rate = v_commission_rate * 100,
    platform_commission_amount = v_commission_amount,
    freelancer_payout_amount = v_freelancer_payout
  WHERE id = p_deal_id;

  -- Create ledger entry for freelancer payout
  INSERT INTO wallet_ledger (
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
    CAST(v_freelancer_payout * 100 AS BIGINT),
    v_deal.escrow_currency,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'client_id', v_deal.client_id,
      'commission_rate', v_commission_rate,
      'commission_amount', v_commission_amount,
      'original_amount', v_amount_decimal,
      'deal_type', CASE WHEN v_deal.order_id IS NOT NULL THEN 'order' ELSE 'task' END,
      'is_boosted', v_deal.is_boosted
    )
  );

  -- Create ledger entry for platform commission
  INSERT INTO wallet_ledger (
    user_id,
    kind,
    status,
    amount_minor,
    currency,
    metadata
  ) VALUES (
    NULL,
    'platform_commission',
    'completed',
    CAST(v_commission_amount * 100 AS BIGINT),
    v_deal.escrow_currency,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'commission_rate', v_commission_rate,
      'freelancer_id', v_deal.freelancer_id,
      'client_id', v_deal.client_id,
      'is_boosted', v_deal.is_boosted,
      'deal_type', CASE WHEN v_deal.order_id IS NOT NULL THEN 'order' ELSE 'task' END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'total_amount', v_amount_decimal,
    'commission_amount', v_commission_amount,
    'commission_rate', v_commission_rate,
    'freelancer_payout', v_freelancer_payout,
    'freelancer_id', v_deal.freelancer_id,
    'new_balance', (SELECT balance FROM profiles WHERE id = v_deal.freelancer_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix lock_funds_in_escrow
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

  -- UPSERT client wallet (creates if missing, updates if exists)
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (
    p_client_id,
    -v_amount_decimal,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = wallets.balance - v_amount_decimal,
    updated_at = NOW();

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
GRANT EXECUTE ON FUNCTION public.release_escrow_to_freelancer TO authenticated;