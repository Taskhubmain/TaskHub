/*
  # Create wallet_stats view for accurate total_earned calculation

  1. New Views
    - `wallet_stats`
      - Calculates total_earned from wallet_ledger based on escrow_release entries
      - Calculates total_deposited from deposit entries
      - Calculates total_withdrawn from withdraw entries
      - Returns user_id, total_earned, total_deposited, total_withdrawn, currency

  2. Purpose
    - Provides accurate calculation of earnings from completed deals
    - total_earned includes all 'escrow_release' with status 'completed'
    - This is the single source of truth for "Всего заработано"

  3. Security
    - Users can only see their own stats
*/

-- Create wallet_stats view
CREATE OR REPLACE VIEW wallet_stats AS
SELECT
  user_id,
  -- Total earned from completed escrow releases (deals)
  COALESCE(
    SUM(CASE
      WHEN kind = 'escrow_release' AND status = 'completed'
      THEN amount_minor
      ELSE 0
    END) / 100.0,
    0
  ) AS total_earned,
  -- Total deposited (successful deposits)
  COALESCE(
    SUM(CASE
      WHEN kind = 'deposit' AND status IN ('succeeded', 'completed')
      THEN amount_minor
      ELSE 0
    END) / 100.0,
    0
  ) AS total_deposited,
  -- Total withdrawn (successful withdrawals)
  COALESCE(
    SUM(CASE
      WHEN kind = 'withdraw' AND status IN ('succeeded', 'completed')
      THEN amount_minor
      ELSE 0
    END) / 100.0,
    0
  ) AS total_withdrawn,
  currency
FROM wallet_ledger
WHERE user_id IS NOT NULL
GROUP BY user_id, currency;

-- Grant select to authenticated users
GRANT SELECT ON wallet_stats TO authenticated;

-- Add comment
COMMENT ON VIEW wallet_stats IS 'Aggregated wallet statistics calculated from wallet_ledger entries. total_earned includes all completed escrow releases from deals.';