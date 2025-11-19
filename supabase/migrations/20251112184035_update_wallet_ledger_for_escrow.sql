/*
  # Update Wallet Ledger for Escrow Support

  ## Changes
  - Add new transaction kinds: 'escrow_lock' and 'escrow_release'
  - Update status constraint to include 'completed'
  - Remove positive-only constraint on amount_minor to allow debits
  
  ## Purpose
  Allow wallet_ledger to track escrow transactions properly
*/

-- Drop old constraints
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_kind_check;
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_status_check;
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_amount_minor_check;

-- Add updated constraints
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_kind_check 
  CHECK (kind IN ('deposit', 'withdraw', 'escrow_lock', 'escrow_release'));

ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_status_check 
  CHECK (status IN ('pending', 'processing', 'succeeded', 'completed', 'failed', 'canceled'));

-- Note: We removed the amount_minor > 0 constraint to allow negative values for debits
