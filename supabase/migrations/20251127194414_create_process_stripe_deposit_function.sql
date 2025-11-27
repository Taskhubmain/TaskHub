/*
  # Create Process Stripe Deposit Function

  1. Purpose
    - Atomic function to process successful Stripe deposits
    - Ensures profiles.balance and wallets.balance stay synchronized
    - Uses UPSERT to handle missing wallet records
    - Called by Stripe webhook edge function
  
  2. Function
    - process_stripe_deposit(transaction_id, amount)
    - Updates transaction status
    - Credits user balance in profiles
    - Credits user balance in wallets (UPSERT)
    - Increments total_earned in wallets
  
  3. Security
    - SECURITY DEFINER with proper search_path
    - Atomic operation (all-or-nothing)
    - Idempotent (can be called multiple times safely)
*/

CREATE OR REPLACE FUNCTION public.process_stripe_deposit(
  p_transaction_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction RECORD;
  v_user_id UUID;
  v_wallet_id UUID;
  v_new_profile_balance NUMERIC;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF v_transaction IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  -- Check if already completed
  IF v_transaction.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already completed'
    );
  END IF;

  -- Check if cancelled or failed
  IF v_transaction.status IN ('cancelled', 'failed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction was cancelled or failed'
    );
  END IF;

  -- Get user_id from wallet
  SELECT user_id INTO v_user_id
  FROM public.wallets
  WHERE id = v_transaction.wallet_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found for wallet'
    );
  END IF;

  -- Update transaction status
  UPDATE public.transactions
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_transaction_id;

  -- Update profile balance
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = v_user_id
  RETURNING balance INTO v_new_profile_balance;

  -- UPSERT wallet balance (creates if missing)
  INSERT INTO public.wallets (user_id, balance, total_earned, updated_at)
  VALUES (
    v_user_id,
    p_amount,
    p_amount,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = wallets.balance + p_amount,
    total_earned = wallets.total_earned + p_amount,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'amount', p_amount,
    'new_balance', v_new_profile_balance
  );
END;
$$;

-- Grant permission (only service role should call this)
GRANT EXECUTE ON FUNCTION public.process_stripe_deposit TO service_role;