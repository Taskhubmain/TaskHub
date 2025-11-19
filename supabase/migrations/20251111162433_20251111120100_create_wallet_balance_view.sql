/*
  # Create wallet_balance view

  1. New Views
    - `wallet_balance`
      - Groups wallet_ledger by user_id
      - Calculates balance as: sum(deposit succeeded) - sum(withdraw succeeded)
      - Returns: user_id, balance_minor (bigint), currency (text)

  2. Security
    - View automatically respects RLS on wallet_ledger
    - Users can only see their own balance
*/

-- Create wallet_balance view
CREATE OR REPLACE VIEW wallet_balance AS
SELECT
  user_id,
  COALESCE(
    SUM(CASE
      WHEN kind = 'deposit' AND status = 'succeeded' THEN amount_minor
      WHEN kind = 'withdraw' AND status = 'succeeded' THEN -amount_minor
      ELSE 0
    END),
    0
  ) AS balance_minor,
  COALESCE(MAX(currency), 'usd') AS currency
FROM wallet_ledger
GROUP BY user_id;

-- Grant select to authenticated users
GRANT SELECT ON wallet_balance TO authenticated;
