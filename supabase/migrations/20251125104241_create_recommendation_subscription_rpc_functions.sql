/*
  # Create Recommendation Subscription RPC Functions

  1. New Functions
    - `has_active_recommendations_subscription(p_user_id uuid)` - Check if user has active subscription
    - `get_subscription_days_remaining(p_user_id uuid)` - Get days remaining on subscription
  
  2. Purpose
    - Support subscription checking in frontend
    - Calculate remaining subscription time
    - Used by RecommendationsPage and generate-order-recommendations edge function
  
  3. Security
    - Functions are SECURITY DEFINER to allow querying recommendations_subscriptions table
    - Users can only check their own subscription status
*/

-- Function to check if user has active recommendations subscription
CREATE OR REPLACE FUNCTION has_active_recommendations_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM recommendations_subscriptions
    WHERE user_id = p_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$;

-- Function to get days remaining on subscription
CREATE OR REPLACE FUNCTION get_subscription_days_remaining(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz;
  v_days_remaining integer;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM recommendations_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;
  
  IF v_expires_at IS NULL THEN
    RETURN 0;
  END IF;
  
  v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_expires_at - now())) / 86400);
  RETURN GREATEST(v_days_remaining, 0);
END;
$$;
