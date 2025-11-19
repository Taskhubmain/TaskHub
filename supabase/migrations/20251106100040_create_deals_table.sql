/*
  # Create deals table for accepted proposals

  ## Overview
  This migration creates the `deals` table to track accepted proposals and active work relationships between clients and freelancers.

  ## New Tables
  
  ### `deals`
  - `id` (uuid, primary key) - Unique identifier for the deal
  - `proposal_id` (uuid, foreign key) - Reference to the accepted proposal
  - `order_id` (uuid, nullable, foreign key) - Reference to order if deal is from order
  - `task_id` (uuid, nullable, foreign key) - Reference to task if deal is from task
  - `client_id` (uuid, foreign key) - The client who posted the order/accepted the proposal
  - `freelancer_id` (uuid, foreign key) - The freelancer who made the proposal
  - `chat_id` (uuid, nullable, foreign key) - Reference to the chat between client and freelancer
  - `title` (text) - Title of the deal
  - `description` (text) - Description of the work
  - `price` (integer) - Agreed price
  - `currency` (text, default 'USD') - Currency for the price
  - `delivery_days` (integer) - Expected delivery time in days
  - `status` (text, default 'in_progress') - Current status: in_progress, completed, disputed, cancelled
  - `created_at` (timestamptz, default now()) - When the deal was created
  - `updated_at` (timestamptz, default now()) - Last update timestamp
  - `completed_at` (timestamptz, nullable) - When the deal was completed

  ## Security
  - Enable RLS on `deals` table
  - Add policy for clients to view their deals
  - Add policy for freelancers to view their deals
  - Add policy for clients to update their deals
  - Add policy for freelancers to update their deals

  ## Constraints
  - Either order_id or task_id must be set (but not both)
*/

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  freelancer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chat_id uuid REFERENCES chats(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  delivery_days integer NOT NULL,
  status text DEFAULT 'in_progress' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CHECK (
    (order_id IS NOT NULL AND task_id IS NULL) OR
    (order_id IS NULL AND task_id IS NOT NULL)
  )
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Freelancers can view their deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Clients can update their deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Freelancers can update their deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Authenticated users can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id OR auth.uid() = freelancer_id
  );

CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_freelancer_id ON deals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_proposal_id ON deals(proposal_id);
