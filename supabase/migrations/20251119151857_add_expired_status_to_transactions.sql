/*
  # Add 'expired' status to transactions

  1. Changes
    - Drop and recreate transactions_status_check constraint
    - Add 'expired' as valid status for transactions
    - Used for deposits that were not paid within 20 minutes

  2. Security
    - Maintains data integrity with check constraint
    - Allows system to mark deposits as expired

  3. Notes
    - 'expired' status is for transactions that timed out
    - Different from 'failed' (payment processing failed)
    - Different from 'cancelled' (user cancelled)
*/

-- Drop the old constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add the new constraint with 'expired' status
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'expired'::text]));
