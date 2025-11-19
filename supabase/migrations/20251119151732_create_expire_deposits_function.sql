/*
  # Create function to expire old deposits

  1. New Functions
    - `expire_old_deposits()` - PL/pgSQL function to mark expired deposits
    - Runs with SECURITY DEFINER to bypass RLS
    - Can be called from edge functions or cron jobs

  2. Changes
    - Creates database function that directly updates transactions
    - Bypasses RLS policies through SECURITY DEFINER
    - Returns count of expired transactions

  3. Security
    - Function runs as database owner (bypasses RLS)
    - Only updates deposits with status='pending'
    - Updates based on expires_at or created_at + 20 minutes

  4. Usage
    - Call from edge function: SELECT expire_old_deposits()
    - Returns INTEGER count of expired deposits
*/

CREATE OR REPLACE FUNCTION expire_old_deposits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
  curr_time TIMESTAMPTZ;
  twenty_mins_ago TIMESTAMPTZ;
BEGIN
  curr_time := NOW();
  twenty_mins_ago := curr_time - INTERVAL '20 minutes';

  -- Update expired deposits
  WITH updated AS (
    UPDATE transactions
    SET
      status = 'expired',
      provider_status = 'expired',
      description = CASE
        WHEN description LIKE '%(превышено время ожидания оплаты)%' THEN description
        WHEN description IS NOT NULL THEN description || ' (превышено время ожидания оплаты)'
        ELSE 'Пополнение кошелька (превышено время ожидания оплаты)'
      END
    WHERE
      type = 'deposit'
      AND status = 'pending'
      AND (
        (expires_at IS NOT NULL AND expires_at < curr_time)
        OR
        (expires_at IS NULL AND created_at < twenty_mins_ago)
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM updated;

  RETURN expired_count;
END;
$$;

-- Grant execute to authenticated users (for edge function calls)
GRANT EXECUTE ON FUNCTION expire_old_deposits() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_deposits() TO anon;
GRANT EXECUTE ON FUNCTION expire_old_deposits() TO service_role;
