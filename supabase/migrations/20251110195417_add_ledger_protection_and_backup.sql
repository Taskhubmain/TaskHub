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

DROP TRIGGER IF EXISTS audit_account_changes ON ledger_accounts;
CREATE TRIGGER audit_account_changes
  AFTER UPDATE ON ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION audit_ledger_account_changes();

-- Function to backup ledger entries
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
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO calculated_balance
  FROM ledger_entries
  WHERE account_id = NEW.id;

  IF calculated_balance != NEW.balance_cents THEN
    RAISE WARNING 'Balance mismatch for account %: calculated=%, stored=%',
      NEW.id, calculated_balance, NEW.balance_cents;

    IF ABS(calculated_balance - NEW.balance_cents) <= 1 THEN
      NEW.balance_cents = calculated_balance;
    ELSE
      RAISE NOTICE 'Critical balance discrepancy detected for account %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_balance ON ledger_accounts;
CREATE TRIGGER validate_balance
  BEFORE UPDATE OF balance_cents ON ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION validate_balance_consistency();

-- Function to prevent entry modification
CREATE OR REPLACE FUNCTION prevent_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Ledger entries cannot be modified after creation';
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'Ledger entries cannot be deleted';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_entries ON ledger_entries;
CREATE TRIGGER protect_entries
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_entry_modification();

-- Emergency recovery function
CREATE OR REPLACE FUNCTION recalculate_account_balance(p_account_id uuid)
RETURNS boolean AS $$
DECLARE
  v_calculated_balance bigint;
  v_current_balance bigint;
BEGIN
  SELECT balance_cents INTO v_current_balance
  FROM ledger_accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account % not found', p_account_id;
  END IF;

  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_calculated_balance
  FROM ledger_entries
  WHERE account_id = p_account_id;

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

-- Function to get audit trail
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

-- Create snapshots table
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