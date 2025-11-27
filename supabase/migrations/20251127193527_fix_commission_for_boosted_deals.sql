/*
  # Fix Commission Logic for Boosted Deals

  1. Changes
    - Update release_escrow_to_freelancer to apply 25% commission for ANY boosted deal
    - Previously: only Tasks with boost had 25% commission
    - Now: ANY deal (Order or Task) with is_boosted=true has 25% commission
  
  2. Commission Logic
    - Deal with is_boosted=true: 25% commission (regardless of order/task)
    - Deal with is_boosted=false: 15% commission (regardless of order/task)
  
  3. Rationale
    - Both Orders and Tasks can use "boost" feature
    - The boost feature should have consistent commission rate
    - Freelancer accepts higher commission for deals with promoted visibility
  
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

  -- Update freelancer balance
  UPDATE profiles
  SET balance = balance + v_freelancer_payout
  WHERE id = v_deal.freelancer_id;

  -- Update freelancer wallet balance and total_earned
  UPDATE wallets
  SET 
    balance = balance + v_freelancer_payout,
    total_earned = total_earned + v_freelancer_payout,
    updated_at = NOW()
  WHERE user_id = v_deal.freelancer_id;

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