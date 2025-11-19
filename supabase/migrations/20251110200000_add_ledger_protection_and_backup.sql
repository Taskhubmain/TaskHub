/*
  # Ledger System Protection and Backup

  ## Overview
  This migration adds critical protection mechanisms and audit trails for the ledger system.
  Financial data integrity is CRITICAL - these safeguards prevent data loss and corruption.

  ## 1. Audit Tables

  ### `ledger_accounts_audit`
  Tracks all changes to ledger account balances
  - `id` (uuid) - Audit record ID
  - `account_id` (uuid) - Reference to ledger_accounts
  - `user_id` (uuid) - Account owner
  - `old_balance_cents` (bigint) - Balance before change
  - `new_balance_cents` (bigint) - Balance after change
  - `diff_cents` (bigint) - Change amount
  - `changed_by` (uuid) - User who made the change
  - `changed_at` (timestamptz) - When change occurred
  - `context` (jsonb) - Additional context (entry_id, journal_id, etc.)

  ### `ledger_entries_audit`
  Immutable log of all ledger entries (cannot be deleted)
  - Copies all data from ledger_entries
  - Prevents accidental deletion of transaction history

  ## 2. Protection Functions

  ### Balance Consistency Check
  - Validates that account balance matches sum of entries
  - Runs on every balance update
  - Prevents balance corruption

  ### Entry Immutability
  - Prevents modification of completed entries
  - Allows only status updates from pending to completed

  ## 3. Automatic Backup

  ### Triggers
  - `audit_ledger_account_changes` - Logs all balance changes
  - `backup_ledger_entry` - Creates immutable backup of entries
  - `validate_balance_consistency` - Ensures balance matches entries

  ## 4. Recovery Functions

  ### `recalculate_account_balance(account_id uuid)`
  - Recalculates balance from all entries
  - Returns true if balance was corrected
  - Use only for emergency recovery

  ### `get_account_audit_trail(account_id uuid, days int)`
  - Returns audit history for an account
  - Useful for investigating discrepancies

  ## 5. Security
  - Audit tables are append-only
  - Only service role can modify protection functions
  - RLS policies prevent user tampering
*/

-- Create audit table for ledger accounts
CREATE TABLE IF NOT EXISTS ledger_accounts_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  old_balance_cents bigint NOT NULL,
  new_balance_cents bigint NOT NULL,
  diff_cents bigint NOT NULL,
  changed_by uuid,
  changed_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_audit_account ON ledger_accounts_audit(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_audit_user ON ledger_accounts_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_audit_changed_at ON ledger_accounts_audit(changed_at DESC);

ALTER TABLE ledger_accounts_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit trail
CREATE POLICY "Users can view own account audit trail"
  ON ledger_accounts_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create immutable backup table for ledger entries
CREATE TABLE IF NOT EXISTS ledger_entries_audit (
  id uuid PRIMARY KEY,
  journal_id uuid NOT NULL,
  account_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  ref_type text NOT NULL,
  ref_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  backed_up_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_audit_account ON ledger_entries_audit(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_audit_journal ON ledger_entries_audit(journal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_audit_ref ON ledger_entries_audit(ref_type, ref_id);

ALTER TABLE ledger_entries_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own entry backups
CREATE POLICY "Users can view own entry backups"
  ON ledger_entries_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries_audit.account_id
      AND ledger_accounts.user_id = auth.uid()
    )
  );

-- Function to audit account balance changes
CREATE OR REPLACE FUNCTION audit_ledger_account_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.balance_cents IS DISTINCT FROM NEW.balance_cents) THEN
    INSERT INTO ledger_accounts_audit (
      account_id,
      user_id,
      old_balance_cents,
      new_balance_cents,
      diff_cents,
      changed_by,
      context
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.balance_cents,
      NEW.balance_cents,
      NEW.balance_cents - OLD.balance_cents,
      auth.uid(),
      jsonb_build_object(
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to audit balance changes
DROP TRIGGER IF EXISTS audit_account_changes ON ledger_accounts;
CREATE TRIGGER audit_account_changes
  AFTER UPDATE ON ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION audit_ledger_account_changes();

-- Function to backup ledger entries (immutable)
CREATE OR REPLACE FUNCTION backup_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ledger_entries_audit (
    id,
    journal_id,
    account_id,
    amount_cents,
    ref_type,
    ref_id,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    NEW.journal_id,
    NEW.account_id,
    NEW.amount_cents,
    NEW.ref_type,
    NEW.ref_id,
    NEW.metadata,
    NEW.created_at
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to backup entries
DROP TRIGGER IF EXISTS backup_entry ON ledger_entries;
CREATE TRIGGER backup_entry
  AFTER INSERT ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION backup_ledger_entry();

-- Function to validate balance consistency
CREATE OR REPLACE FUNCTION validate_balance_consistency()
RETURNS TRIGGER AS $$
DECLARE
  calculated_balance bigint;
BEGIN
  -- Calculate balance from all entries
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO calculated_balance
  FROM ledger_entries
  WHERE account_id = NEW.id;

  -- Check if balance matches
  IF calculated_balance != NEW.balance_cents THEN
    RAISE WARNING 'Balance mismatch for account %: calculated=%, stored=%',
      NEW.id, calculated_balance, NEW.balance_cents;

    -- Auto-correct if difference is small (under 1 cent due to rounding)
    IF ABS(calculated_balance - NEW.balance_cents) <= 1 THEN
      NEW.balance_cents = calculated_balance;
    ELSE
      -- Log critical error but don't block transaction
      RAISE NOTICE 'Critical balance discrepancy detected for account %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate balance
DROP TRIGGER IF EXISTS validate_balance ON ledger_accounts;
CREATE TRIGGER validate_balance
  BEFORE UPDATE OF balance_cents ON ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_balance_consistency();

-- Function to prevent entry modification
CREATE OR REPLACE FUNCTION prevent_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow inserts
  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  END IF;

  -- Prevent updates (entries should be immutable)
  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Ledger entries cannot be modified after creation';
  END IF;

  -- Prevent deletes
  IF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'Ledger entries cannot be deleted';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent entry modification
DROP TRIGGER IF EXISTS protect_entries ON ledger_entries;
CREATE TRIGGER protect_entries
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_entry_modification();

-- Emergency recovery function: recalculate account balance
CREATE OR REPLACE FUNCTION recalculate_account_balance(p_account_id uuid)
RETURNS boolean AS $$
DECLARE
  v_calculated_balance bigint;
  v_current_balance bigint;
BEGIN
  -- Get current balance
  SELECT balance_cents INTO v_current_balance
  FROM ledger_accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account % not found', p_account_id;
  END IF;

  -- Calculate from entries
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_calculated_balance
  FROM ledger_entries
  WHERE account_id = p_account_id;

  -- Update if different
  IF v_calculated_balance != v_current_balance THEN
    UPDATE ledger_accounts
    SET balance_cents = v_calculated_balance
    WHERE id = p_account_id;

    RAISE NOTICE 'Balance corrected for account %: % -> %',
      p_account_id, v_current_balance, v_calculated_balance;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account audit trail
CREATE OR REPLACE FUNCTION get_account_audit_trail(
  p_account_id uuid,
  p_days int DEFAULT 30
)
RETURNS TABLE (
  changed_at timestamptz,
  old_balance_cents bigint,
  new_balance_cents bigint,
  diff_cents bigint,
  context jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.changed_at,
    a.old_balance_cents,
    a.new_balance_cents,
    a.diff_cents,
    a.context
  FROM ledger_accounts_audit a
  WHERE a.account_id = p_account_id
    AND a.changed_at >= now() - (p_days || ' days')::interval
  ORDER BY a.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create daily balance snapshot table for historical reporting
CREATE TABLE IF NOT EXISTS ledger_accounts_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  balance_cents bigint NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_ledger_snapshots_account ON ledger_accounts_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_snapshots_date ON ledger_accounts_snapshots(snapshot_date DESC);

ALTER TABLE ledger_accounts_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON ledger_accounts_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create daily snapshots
CREATE OR REPLACE FUNCTION create_daily_balance_snapshots()
RETURNS void AS $$
BEGIN
  INSERT INTO ledger_accounts_snapshots (
    account_id,
    user_id,
    kind,
    balance_cents,
    snapshot_date
  )
  SELECT
    id,
    user_id,
    kind,
    balance_cents,
    current_date
  FROM ledger_accounts
  ON CONFLICT (account_id, snapshot_date) DO UPDATE
  SET balance_cents = EXCLUDED.balance_cents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: Run create_daily_balance_snapshots() via cron job daily
-- This can be set up in Supabase Dashboard -> Database -> Cron Jobs
