/*
  # Optimize RLS Policies - Part 9: Admin and Moderation

  1. Changes
    - Optimize auth.uid() calls in user_warnings, admin_settings, admin_passwords, moderation_reports, user_suggestions
*/

-- User warnings: Drop old policies
DROP POLICY IF EXISTS "Users can view own warnings" ON user_warnings;

-- User warnings: Recreate with optimized policies
CREATE POLICY "Users can view own warnings"
  ON user_warnings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Admin settings: Drop old policies
DROP POLICY IF EXISTS "Admins can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON admin_settings;

-- Admin settings: Recreate with optimized policies
CREATE POLICY "Admins can view settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );

-- Admin passwords: Drop old policies
DROP POLICY IF EXISTS "Admins can manage passwords" ON admin_passwords;

-- Admin passwords: Recreate with optimized policies
CREATE POLICY "Admins can manage passwords"
  ON admin_passwords
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );

-- Moderation reports: Drop old policies
DROP POLICY IF EXISTS "Users can create reports" ON moderation_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON moderation_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON moderation_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON moderation_reports;

-- Moderation reports: Recreate with optimized policies
CREATE POLICY "Users can create reports"
  ON moderation_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));

CREATE POLICY "Users can view own reports"
  ON moderation_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = (select auth.uid()));

CREATE POLICY "Admins can view all reports"
  ON moderation_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update reports"
  ON moderation_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );

-- User suggestions: Drop old policies
DROP POLICY IF EXISTS "Users can create suggestions" ON user_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON user_suggestions;
DROP POLICY IF EXISTS "Admins can update all suggestions" ON user_suggestions;

-- User suggestions: Recreate with optimized policies
CREATE POLICY "Users can create suggestions"
  ON user_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own suggestions"
  ON user_suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can update all suggestions"
  ON user_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'ADMIN'
    )
  );
