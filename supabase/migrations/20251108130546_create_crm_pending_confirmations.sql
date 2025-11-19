/*
  # Create CRM Pending Confirmations Table

  1. New Tables
    - `crm_pending_confirmations`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, foreign key to chats)
      - `field_name` (text) - название поля (order_title, total_price, deadline, priority, task)
      - `field_value` (jsonb) - значение поля для подтверждения
      - `confidence` (numeric) - уровень уверенности AI (0.0-1.0)
      - `message` (text) - сообщение для пользователя
      - `status` (text) - pending, confirmed, rejected
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `crm_pending_confirmations` table
    - Add policies for authenticated users to manage confirmations in their chats

  3. Indexes
    - Index on chat_id and status for efficient queries
*/

CREATE TABLE IF NOT EXISTS crm_pending_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value jsonb NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_pending_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view confirmations in their chats"
  ON crm_pending_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = crm_pending_confirmations.chat_id
      AND (chats.participant1_id::text = auth.uid()::text OR chats.participant2_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update confirmations in their chats"
  ON crm_pending_confirmations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = crm_pending_confirmations.chat_id
      AND (chats.participant1_id::text = auth.uid()::text OR chats.participant2_id::text = auth.uid()::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = crm_pending_confirmations.chat_id
      AND (chats.participant1_id::text = auth.uid()::text OR chats.participant2_id::text = auth.uid()::text)
    )
  );

CREATE INDEX IF NOT EXISTS idx_crm_pending_confirmations_chat_status 
  ON crm_pending_confirmations(chat_id, status);

CREATE INDEX IF NOT EXISTS idx_crm_pending_confirmations_created 
  ON crm_pending_confirmations(created_at DESC);

ALTER TABLE crm_pending_confirmations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE crm_pending_confirmations;
