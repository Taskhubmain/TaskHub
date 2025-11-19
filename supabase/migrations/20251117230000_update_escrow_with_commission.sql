/*
  # Update Escrow Functions with Platform Commission

  1. Changes
    - Update release_escrow_to_freelancer to deduct platform commission
    - Freelancer receives 75% (with boost) or 85% (without boost)
    - Platform receives 25% (with boost) or 15% (without boost)
    - Create separate ledger entries for platform revenue

  2. Notes
    - Commission is based on is_boosted field in deals table
    - Platform commission is tracked separately for accounting
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
    escrow_amount,
    escrow_currency,
    freelancer_id,
    client_id,
    status,
    escrow_released_at,
    is_boosted,
    price
  INTO v_deal
  FROM deals
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

  v_amount_decimal := v_deal.escrow_amount / 100.0;

  IF v_deal.is_boosted THEN
    v_commission_rate := 0.25;
  ELSE
    v_commission_rate := 0.15;
  END IF;

  v_commission_amount := v_amount_decimal * v_commission_rate;
  v_freelancer_payout := v_amount_decimal - v_commission_amount;

  UPDATE profiles
  SET balance = balance + v_freelancer_payout
  WHERE id = v_deal.freelancer_id;

  UPDATE deals
  SET
    escrow_released_at = NOW(),
    platform_commission_rate = v_commission_rate * 100,
    platform_commission_amount = v_commission_amount,
    freelancer_payout_amount = v_freelancer_payout
  WHERE id = p_deal_id;

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
      'original_amount', v_amount_decimal
    )
  );

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
      'is_boosted', v_deal.is_boosted
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
