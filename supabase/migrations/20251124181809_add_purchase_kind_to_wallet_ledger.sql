/*
  # Add 'purchase' kind to wallet_ledger

  1. Changes
    - Drop existing check constraint on wallet_ledger.kind
    - Add new check constraint that includes 'purchase' as valid kind

  2. New allowed kinds
    - deposit: User deposits money to wallet
    - withdraw: User withdraws money from wallet
    - escrow_lock: Money locked in escrow for a deal
    - escrow_release: Money released from escrow
    - purchase: User purchases something (e.g., subscription, proposals)

  3. Security
    - Maintains data integrity by ensuring only valid kinds are allowed
*/

-- Drop old constraint
ALTER TABLE wallet_ledger 
DROP CONSTRAINT IF EXISTS wallet_ledger_kind_check;

-- Add new constraint with 'purchase' included
ALTER TABLE wallet_ledger
ADD CONSTRAINT wallet_ledger_kind_check 
CHECK (kind = ANY (ARRAY[
  'deposit'::text, 
  'withdraw'::text, 
  'escrow_lock'::text, 
  'escrow_release'::text,
  'purchase'::text
]));
