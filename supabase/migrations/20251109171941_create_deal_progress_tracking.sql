/*
  # Create deal progress tracking system

  1. New Tables
    - `deal_progress_reports`
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals)
      - `progress_percentage` (integer, 0-100)
      - `comment` (text)
      - `created_by` (uuid, user id)
      - `created_at` (timestamptz)
    
    - `deal_task_items`
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals)
      - `task_name` (text)
      - `is_completed` (boolean)
      - `order_index` (integer)
      - `created_at` (timestamptz)
    
    - `deal_time_extensions`
      - `id` (uuid, primary key)
      - `deal_id` (uuid, foreign key to deals)
      - `requested_by` (uuid, user id)
      - `reason` (text)
      - `additional_days` (integer)
      - `status` (text: pending, approved, rejected)
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz)

  2. New Columns in deals table
    - `current_progress` (integer, default 0)
    - `last_progress_update` (timestamptz)
    - `progress_reminder_sent` (boolean, default false)

  3. Security
    - Enable RLS on all new tables
    - Add policies for deal participants to manage progress
*/

-- Add progress tracking columns to deals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'current_progress'
  ) THEN
    ALTER TABLE deals ADD COLUMN current_progress integer DEFAULT 0 CHECK (current_progress >= 0 AND current_progress <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'last_progress_update'
  ) THEN
    ALTER TABLE deals ADD COLUMN last_progress_update timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'progress_reminder_sent'
  ) THEN
    ALTER TABLE deals ADD COLUMN progress_reminder_sent boolean DEFAULT false;
  END IF;
END $$;

-- Create deal_progress_reports table
CREATE TABLE IF NOT EXISTS deal_progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  progress_percentage integer NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  comment text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view progress reports"
  ON deal_progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_progress_reports.deal_id
      AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can create progress reports"
  ON deal_progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_id
      AND deals.freelancer_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Create deal_task_items table
CREATE TABLE IF NOT EXISTS deal_task_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  is_completed boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_task_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view task items"
  ON deal_task_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_task_items.deal_id
      AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can manage task items"
  ON deal_task_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_task_items.deal_id
      AND deals.freelancer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_task_items.deal_id
      AND deals.freelancer_id = auth.uid()
    )
  );

-- Create deal_time_extensions table
CREATE TABLE IF NOT EXISTS deal_time_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  reason text NOT NULL,
  additional_days integer NOT NULL CHECK (additional_days > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE deal_time_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view time extensions"
  ON deal_time_extensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND (deals.client_id = auth.uid() OR deals.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can request time extensions"
  ON deal_time_extensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_id
      AND deals.freelancer_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Clients can update time extension status"
  ON deal_time_extensions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND deals.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND deals.client_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_progress_reports_deal_id ON deal_progress_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_task_items_deal_id ON deal_task_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_time_extensions_deal_id ON deal_time_extensions(deal_id);
