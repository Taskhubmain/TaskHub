/*
  # Fix release_escrow_to_freelancer - Remove Platform Commission Ledger Entry

  1. Problem
    - Function tries to INSERT into wallet_ledger with user_id = NULL for platform commission
    - wallet_ledger.user_id has NOT NULL constraint, causing the function to fail
    - This prevents escrow release and freelancer payment
  
  2. Solution
    - Remove the platform commission ledger entry insertion
    - Platform commission is already tracked in deals table (platform_commission_rate, platform_commission_amount)
    - wallet_ledger should only track user operations, not platform revenue
  
  3. Changes
    - Remove INSERT statement for platform_commission from release_escrow_to_freelancer
    - Keep only freelancer payout ledger entry
  
  4. Security
    - Maintains SECURITY DEFINER with proper search_path
    - All operations remain atomic
*/

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

  -- Create ledger entry for freelancer payout (user operation)
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

  -- Note: Platform commission is tracked in deals table, not in wallet_ledger
  -- wallet_ledger is for user transactions only

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

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION release_escrow_to_freelancer TO authenticated;