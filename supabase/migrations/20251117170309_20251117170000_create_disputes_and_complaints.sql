/*
  # Create disputes and complaints tables

  1. New Tables
    - `disputes`
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals)
      - `order_id` (uuid, foreign key to orders, nullable)
      - `task_id` (uuid, foreign key to tasks, nullable)
      - `opened_by` (uuid, foreign key to profiles)
      - `status` (text: 'open', 'resolved_client', 'resolved_freelancer', 'cancelled')
      - `resolution_notes` (text, nullable)
      - `resolved_by` (uuid, foreign key to profiles, nullable - admin)
      - `resolved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `complaints`
      - `id` (uuid, primary key)
      - `reported_user_id` (uuid, foreign key to profiles)
      - `reporter_id` (uuid, foreign key to profiles)
      - `chat_id` (uuid, foreign key to chats, nullable)
      - `reason` (text)
      - `description` (text)
      - `status` (text: 'pending', 'reviewed', 'dismissed')
      - `reviewed_by` (uuid, foreign key to profiles, nullable - admin)
      - `reviewed_at` (timestamptz, nullable)
      - `admin_notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can view their own disputes/complaints
    - Admins can view and manage all
*/

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  opened_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved_client', 'resolved_freelancer', 'cancelled')),
  resolution_notes text,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id uuid REFERENCES chats(id) ON DELETE SET NULL,
  reason text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_disputes_deal_id ON disputes(deal_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_reported_user_id ON complaints(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reporter_id ON complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Disputes policies
CREATE POLICY "Users can view disputes they are involved in"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    opened_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = disputes.deal_id
      AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create disputes for their deals"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    opened_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_id
      AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
      AND deals.status NOT IN ('completed', 'cancelled')
    )
  );

CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Complaints policies
CREATE POLICY "Users can view their own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid() OR
    reported_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid() AND
    reported_user_id != auth.uid()
  );

CREATE POLICY "Admins can update complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add updated_at trigger for disputes
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- Add updated_at trigger for complaints
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaints_updated_at();

-- Enable realtime for disputes and complaints
ALTER PUBLICATION supabase_realtime ADD TABLE disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
