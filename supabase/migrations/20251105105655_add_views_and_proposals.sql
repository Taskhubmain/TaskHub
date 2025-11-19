/*
  # Add Views Counter and Proposals Table

  1. Changes to Existing Tables
    - Add `views_count` column to orders table (default 0)
    - Add `views_count` column to tasks table (default 0)

  2. New Tables
    - `proposals`
      - `id` (uuid, primary key)
      - `order_id` (uuid, nullable, references orders)
      - `task_id` (uuid, nullable, references tasks)
      - `user_id` (uuid, references auth.users)
      - `message` (text, proposal description)
      - `price` (integer, proposed price)
      - `currency` (text, currency code)
      - `delivery_days` (integer, estimated delivery time)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on proposals table
    - Add policies for:
      - Users can view proposals on their own orders/tasks
      - Users can view their own proposals
      - Users can create proposals
      - Users can update their own proposals

  4. Important Notes
    - Either order_id OR task_id must be set (not both)
    - Views are incremented when someone views details
    - Proposals track all responses to orders/tasks
*/

-- Add views_count to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE orders ADD COLUMN views_count integer DEFAULT 0;
  END IF;
END $$;

-- Add views_count to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE tasks ADD COLUMN views_count integer DEFAULT 0;
  END IF;
END $$;

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  price integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  delivery_days integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT either_order_or_task CHECK (
    (order_id IS NOT NULL AND task_id IS NULL) OR
    (order_id IS NULL AND task_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Policies for proposals
CREATE POLICY "Users can view proposals on their orders/tasks"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = proposals.order_id
      AND orders.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_order_id ON proposals(order_id);
CREATE INDEX IF NOT EXISTS idx_proposals_task_id ON proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Update trigger for proposals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
