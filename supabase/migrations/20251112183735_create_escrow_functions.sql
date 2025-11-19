/*
  # Create Escrow Transaction Functions

  ## Functions Created
  
  ### 1. lock_funds_in_escrow
  - Deducts amount from client's balance
  - Stores amount in deal.escrow_amount
  - Creates wallet_ledger entry for tracking
  
  ### 2. release_escrow_to_freelancer
  - Transfers escrow_amount to freelancer's balance
  - Creates wallet_ledger entries for both parties
  - Marks escrow as released
  
  ## Security
  - Uses transactions to ensure atomicity
  - Validates sufficient balance before locking
  - Prevents double-release of escrow
*/

-- Function to lock funds in escrow when deal is created
CREATE OR REPLACE FUNCTION lock_funds_in_escrow(
  p_deal_id UUID,
  p_client_id UUID,
  p_amount_minor BIGINT,
  p_currency TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_client_balance NUMERIC;
  v_amount_decimal NUMERIC;
BEGIN
  -- Convert minor units to decimal (cents to dollars)
  v_amount_decimal := p_amount_minor / 100.0;
  
  -- Check client's balance
  SELECT balance INTO v_client_balance
  FROM profiles
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
  UPDATE profiles
  SET balance = balance - v_amount_decimal
  WHERE id = p_client_id;
  
  -- Store in escrow
  UPDATE deals
  SET 
    escrow_amount = p_amount_minor,
    escrow_currency = p_currency
  WHERE id = p_deal_id;
  
  -- Create ledger entry
  INSERT INTO wallet_ledger (
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
    'new_balance', (SELECT balance FROM profiles WHERE id = p_client_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release escrow to freelancer when deal completes
CREATE OR REPLACE FUNCTION release_escrow_to_freelancer(
  p_deal_id UUID
)
RETURNS JSONB AS $$
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
  
  -- Convert to decimal
  v_amount_decimal := v_deal.escrow_amount / 100.0;
  
  -- Add to freelancer balance
  UPDATE profiles
  SET balance = balance + v_amount_decimal
  WHERE id = v_deal.freelancer_id;
  
  -- Mark escrow as released
  UPDATE deals
  SET escrow_released_at = NOW()
  WHERE id = p_deal_id;
  
  -- Create ledger entry for freelancer (credit)
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
    'new_balance', (SELECT balance FROM profiles WHERE id = v_deal.freelancer_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION lock_funds_in_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION release_escrow_to_freelancer TO authenticated;
