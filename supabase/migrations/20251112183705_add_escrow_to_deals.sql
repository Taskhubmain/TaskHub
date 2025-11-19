/*
  # Add Escrow System to Deals

  ## Changes
  - Add `escrow_amount` field to deals table to hold locked funds
  - Add `escrow_currency` field to track currency of locked funds
  - Add `escrow_released_at` timestamp to track when funds were released
  
  ## Purpose
  When a client accepts a proposal:
  1. Check if client has sufficient balance
  2. Lock funds in escrow (deduct from client balance, store in deal.escrow_amount)
  3. When deal completes, transfer escrow to freelancer balance
  4. This ensures secure payments and prevents disputes
*/

-- Add escrow fields to deals table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS escrow_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ;

-- Add comment explaining the fields
COMMENT ON COLUMN deals.escrow_amount IS 'Amount locked in escrow (in minor units, e.g., cents)';
COMMENT ON COLUMN deals.escrow_currency IS 'Currency of the escrowed amount';
COMMENT ON COLUMN deals.escrow_released_at IS 'When the escrow was released to the freelancer';
