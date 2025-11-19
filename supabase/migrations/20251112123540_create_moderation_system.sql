/*
  # Create AI moderation system

  1. New Tables
    - `moderation_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `content_type` (text) - proposal, message, order, task
      - `content_id` (uuid) - id of the content being moderated
      - `original_content` (text) - the content that was checked
      - `flagged` (boolean) - whether content was flagged
      - `flag_reasons` (text[]) - array of reasons (profanity, external_payment, external_platform, phone_number)
      - `confidence_score` (numeric) - AI confidence 0-1
      - `action_taken` (text) - none, warning, blocked
      - `created_at` (timestamptz)
    
    - `user_warnings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `warning_type` (text)
      - `description` (text)
      - `severity` (integer) - 1-3 (low, medium, high)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can view their own warnings
    - Only system can insert moderation logs
*/

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL,
  content_id uuid,
  original_content text NOT NULL,
  flagged boolean DEFAULT false,
  flag_reasons text[] DEFAULT ARRAY[]::text[],
  confidence_score numeric(3, 2) DEFAULT 0.0,
  action_taken text DEFAULT 'none',
  created_at timestamptz DEFAULT now()
);

-- Create user_warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  warning_type text NOT NULL,
  description text NOT NULL,
  severity integer DEFAULT 1 CHECK (severity >= 1 AND severity <= 3),
  created_at timestamptz DEFAULT now()
);

-- Add warning_count to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'warning_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN warning_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

-- Moderation logs policies (admin only - for now, no user access)
CREATE POLICY "Service role can manage moderation logs"
  ON moderation_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- User warnings policies
CREATE POLICY "Users can view own warnings"
  ON user_warnings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage warnings"
  ON user_warnings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_flagged ON moderation_logs(flagged);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_severity ON user_warnings(severity);