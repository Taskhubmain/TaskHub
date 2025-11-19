/*
  # Optimize RLS Policies - Part 7: User Preferences and Ledger

  1. Changes
    - Optimize auth.uid() calls in user_preferences, ledger_accounts, ledger_entries, audit tables
*/

-- User preferences: Drop old policies
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- User preferences: Recreate with optimized policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Ledger accounts: Drop old policies
DROP POLICY IF EXISTS "Users can view own ledger accounts" ON ledger_accounts;
DROP POLICY IF EXISTS "Users can insert own ledger accounts" ON ledger_accounts;

-- Ledger accounts: Recreate with optimized policies
CREATE POLICY "Users can view own ledger accounts"
  ON ledger_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own ledger accounts"
  ON ledger_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Ledger entries: Drop old policies
DROP POLICY IF EXISTS "Users can view own ledger entries" ON ledger_entries;
DROP POLICY IF EXISTS "Users can insert own ledger entries" ON ledger_entries;

-- Ledger entries: Recreate with optimized policies
CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries.account_id
      AND ledger_accounts.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own ledger entries"
  ON ledger_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries.account_id
      AND ledger_accounts.user_id = (select auth.uid())
    )
  );

-- Ledger accounts audit: Drop old policies
DROP POLICY IF EXISTS "Users can view own account audit trail" ON ledger_accounts_audit;

-- Ledger accounts audit: Recreate with optimized policies
CREATE POLICY "Users can view own account audit trail"
  ON ledger_accounts_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_accounts_audit.account_id
      AND ledger_accounts.user_id = (select auth.uid())
    )
  );

-- Ledger entries audit: Drop old policies
DROP POLICY IF EXISTS "Users can view own entry backups" ON ledger_entries_audit;

-- Ledger entries audit: Recreate with optimized policies
CREATE POLICY "Users can view own entry backups"
  ON ledger_entries_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_entries_audit.account_id
      AND ledger_accounts.user_id = (select auth.uid())
    )
  );

-- Ledger accounts snapshots: Drop old policies
DROP POLICY IF EXISTS "Users can view own snapshots" ON ledger_accounts_snapshots;

-- Ledger accounts snapshots: Recreate with optimized policies
CREATE POLICY "Users can view own snapshots"
  ON ledger_accounts_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ledger_accounts
      WHERE ledger_accounts.id = ledger_accounts_snapshots.account_id
      AND ledger_accounts.user_id = (select auth.uid())
    )
  );
