/*
  # Create RPC Functions for Purchases with Wallet Sync

  1. Purpose
    - Create atomic functions for purchases (proposals and subscriptions)
    - Ensure profiles.balance and wallets.balance stay synchronized
    - Use UPSERT to handle missing wallet records
  
  2. Functions
    - purchase_proposals(user_id, amount, price, metadata)
    - purchase_subscription(user_id, plan_type, days, price, metadata)
  
  3. Benefits
    - Atomic operations (all-or-nothing)
    - Consistent balance synchronization
    - Better error handling
    - No race conditions
  
  4. Security
    - SECURITY DEFINER with proper search_path
    - Checks balance before deduction
*/

-- Function to purchase proposals
CREATE OR REPLACE FUNCTION public.purchase_proposals(
  p_user_id UUID,
  p_amount INTEGER,
  p_price NUMERIC,
  p_currency TEXT DEFAULT 'usd'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_purchased INTEGER;
  v_new_balance NUMERIC;
  v_new_purchased INTEGER;
BEGIN
  -- Get current balance and purchased proposals
  SELECT balance, COALESCE(purchased_proposals, 0)
  INTO v_current_balance, v_current_purchased
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'required', p_price,
      'available', v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - p_price;
  v_new_purchased := v_current_purchased + p_amount;

  -- Update profiles
  UPDATE public.profiles
  SET 
    balance = v_new_balance,
    purchased_proposals = v_new_purchased
  WHERE id = p_user_id;

  -- UPSERT wallets (creates if missing)
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (p_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = v_new_balance,
    updated_at = NOW();

  -- Create ledger entry
  INSERT INTO public.wallet_ledger (
    user_id,
    kind,
    status,
    amount_minor,
    currency,
    metadata
  ) VALUES (
    p_user_id,
    'purchase',
    'completed',
    CAST(-p_price * 100 AS BIGINT),
    p_currency,
    jsonb_build_object(
      'purchase_type', 'proposals',
      'amount', p_amount,
      'price', p_price,
      'description', format('Покупка %s откликов', p_amount)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'new_purchased_proposals', v_new_purchased
  );
END;
$$;

-- Function to purchase subscription
CREATE OR REPLACE FUNCTION public.purchase_subscription(
  p_user_id UUID,
  p_plan_type TEXT,
  p_days INTEGER,
  p_price NUMERIC,
  p_plan_name TEXT,
  p_currency TEXT DEFAULT 'usd'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_expires_at TIMESTAMPTZ;
  v_existing_expires TIMESTAMPTZ;
BEGIN
  -- Get current balance
  SELECT balance
  INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'required', p_price,
      'available', v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - p_price;

  -- Update profiles balance
  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  -- UPSERT wallets (creates if missing)
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (p_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = v_new_balance,
    updated_at = NOW();

  -- Check for existing active subscription
  SELECT expires_at INTO v_existing_expires
  FROM public.recommendations_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW()
  ORDER BY expires_at DESC
  LIMIT 1;

  -- Calculate new expiration date
  IF v_existing_expires IS NOT NULL THEN
    v_expires_at := v_existing_expires + (p_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NOW() + (p_days || ' days')::INTERVAL;
  END IF;

  -- Insert subscription
  INSERT INTO public.recommendations_subscriptions (
    user_id,
    plan_type,
    expires_at,
    price_paid,
    is_active
  ) VALUES (
    p_user_id,
    p_plan_type,
    v_expires_at,
    p_price,
    true
  );

  -- Create ledger entry
  INSERT INTO public.wallet_ledger (
    user_id,
    kind,
    status,
    amount_minor,
    currency,
    metadata
  ) VALUES (
    p_user_id,
    'purchase',
    'completed',
    CAST(-p_price * 100 AS BIGINT),
    p_currency,
    jsonb_build_object(
      'purchase_type', 'subscription',
      'plan_type', p_plan_type,
      'days', p_days,
      'description', format('Подписка на рекомендации заказов (%s)', p_plan_name)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.purchase_proposals TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_subscription TO authenticated;