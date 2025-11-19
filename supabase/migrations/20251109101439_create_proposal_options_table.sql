/*
  # Create Proposal Options Table

  1. New Tables
    - `proposal_options`
      - `id` (uuid, primary key)
      - `proposal_id` (uuid, foreign key to proposals)
      - `title` (text, название опции)
      - `description` (text, описание опции)
      - `price` (integer, цена опции)
      - `delivery_days` (integer, срок выполнения опции в днях)
      - `order_index` (integer, порядок отображения)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on proposal_options table
    - Add policies for:
      - Users can view options for proposals they can see
      - Users can create options for their own proposals
      - Users can update/delete options for their own proposals

  3. Important Notes
    - Options allow breaking down proposals into multiple deliverables
    - Each option has its own price and delivery time
    - Options are displayed in order specified by order_index
    - Users can create multiple options per proposal
*/

-- Create proposal_options table
CREATE TABLE IF NOT EXISTS proposal_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL,
  delivery_days integer NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE proposal_options ENABLE ROW LEVEL SECURITY;

-- Policies for proposal_options
CREATE POLICY "Users can view options for their proposals"
  ON proposal_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view options for proposals on their orders/tasks"
  ON proposal_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND (
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
      )
    )
  );

CREATE POLICY "Users can create options for their proposals"
  ON proposal_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options for their proposals"
  ON proposal_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options for their proposals"
  ON proposal_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_options_proposal_id ON proposal_options(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_options_order_index ON proposal_options(proposal_id, order_index);
