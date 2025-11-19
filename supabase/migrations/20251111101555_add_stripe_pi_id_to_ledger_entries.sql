-- Add stripe_pi_id column for idempotency on deposits
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS stripe_pi_id text;

-- Create unique index to prevent duplicate deposits
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_stripe_pi_deposit 
ON ledger_entries(stripe_pi_id) 
WHERE ref_type = 'DEPOSIT' AND stripe_pi_id IS NOT NULL;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ledger_entries_stripe_pi ON ledger_entries(stripe_pi_id) WHERE stripe_pi_id IS NOT NULL;