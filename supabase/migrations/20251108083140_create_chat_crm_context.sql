/*
  # Create CRM Context Table for Chats

  1. New Tables
    - `chat_crm_context`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, foreign key to chats)
      - `client_id` (text, user who is the client)
      - `executor_id` (text, user who is the executor)
      - `order_title` (text, extracted order title)
      - `agreed_price` (numeric, agreed price if mentioned)
      - `currency` (text, currency code)
      - `deadline` (timestamptz, deadline if mentioned)
      - `priority` (text, high/medium/low)
      - `tasks` (jsonb, array of task objects with status)
      - `notes` (text, AI extracted notes)
      - `last_updated_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_crm_context` table
    - Add policies for chat participants to read/update their CRM context
    - Only participants of the chat can access the CRM data

  3. Indexes
    - Index on chat_id for fast lookups
    - Index on client_id and executor_id for filtering
*/

CREATE TABLE IF NOT EXISTS chat_crm_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL UNIQUE,
  client_id text,
  executor_id text,
  order_title text DEFAULT '',
  agreed_price numeric(12, 2),
  currency text DEFAULT 'USD',
  deadline timestamptz,
  priority text DEFAULT 'medium',
  tasks jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE chat_crm_context ENABLE ROW LEVEL SECURITY;

-- Participants can view CRM context for their chats
CREATE POLICY "Chat participants can view CRM context"
  ON chat_crm_context
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

-- Participants can update CRM context for their chats
CREATE POLICY "Chat participants can update CRM context"
  ON chat_crm_context
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

-- Participants can insert CRM context for their chats
CREATE POLICY "Chat participants can insert CRM context"
  ON chat_crm_context
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

-- Participants can delete CRM context for their chats
CREATE POLICY "Chat participants can delete CRM context"
  ON chat_crm_context
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_crm_context.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_crm_context_chat_id ON chat_crm_context(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_crm_context_client_id ON chat_crm_context(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_crm_context_executor_id ON chat_crm_context(executor_id);

-- Enable realtime for CRM updates
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_crm_context;
  END IF;
END $$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_crm_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_crm_context_timestamp ON chat_crm_context;

CREATE TRIGGER update_chat_crm_context_timestamp
  BEFORE UPDATE ON chat_crm_context
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_crm_context_timestamp();
