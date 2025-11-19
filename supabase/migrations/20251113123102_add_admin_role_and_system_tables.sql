/*
  # Add Admin Role and System Tables

  1. Changes to Profiles
    - Add ADMIN role support
    - Add is_online tracking
    - Add last_seen timestamp

  2. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `commission_rate` (numeric, percentage)
      - `updated_by` (uuid, admin who made change)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_passwords`
      - `admin_id` (uuid, references profiles)
      - `password_hash` (text, bcrypt hash)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `moderation_reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `reported_user_id` (uuid, references profiles)
      - `reported_content_type` (text: order, task, message, review)
      - `reported_content_id` (uuid)
      - `reason` (text)
      - `description` (text)
      - `status` (text: pending, reviewing, resolved, dismissed)
      - `reviewed_by` (uuid, admin who reviewed)
      - `resolution` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category` (text: feature, improvement, bug, other)
      - `status` (text: new, under_review, planned, implemented, rejected)
      - `admin_notes` (text)
      - `votes` (integer, upvotes count)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Admins can access everything
    - Regular users have limited access

  4. Initial Data
    - Create default admin settings with 10% commission
*/

-- Add is_online and last_seen to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;
END $$;

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_passwords table
CREATE TABLE IF NOT EXISTS admin_passwords (
  admin_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create moderation_reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_type text NOT NULL,
  reported_content_id uuid NOT NULL,
  reason text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_suggestions table
CREATE TABLE IF NOT EXISTS user_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other',
  status text DEFAULT 'new',
  admin_notes text DEFAULT '',
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings
CREATE POLICY "Admins can view settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update settings"
  ON admin_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for admin_passwords
CREATE POLICY "Admins can manage passwords"
  ON admin_passwords FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for moderation_reports
CREATE POLICY "Users can create reports"
  ON moderation_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON moderation_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON moderation_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update reports"
  ON moderation_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for user_suggestions
CREATE POLICY "Users can create suggestions"
  ON user_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view suggestions"
  ON user_suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can update own suggestions"
  ON user_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all suggestions"
  ON user_suggestions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter ON moderation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reported_user ON moderation_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_status ON user_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_user ON user_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = true;

-- Insert default admin settings
INSERT INTO admin_settings (commission_rate)
VALUES (10.00)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for admin tables
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE user_suggestions;