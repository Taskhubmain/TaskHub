/*
  # Add idempotency key to transactions table

  1. Changes
    - Add `idempotency_key` column to `transactions` table for duplicate prevention
    - Create unique index on `idempotency_key` to ensure one transaction per key
    - This allows frontend to safely retry requests without creating duplicates

  2. Security
    - The unique constraint prevents duplicate transactions even with multiple clicks
    - Existing RLS policies remain unchanged and continue to protect data
*/

alter table public.transactions
add column if not exists idempotency_key text;

create unique index if not exists transactions_idempotency_key_key
on public.transactions (idempotency_key)
where idempotency_key is not null;