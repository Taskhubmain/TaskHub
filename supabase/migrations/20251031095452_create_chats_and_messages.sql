/*
  # Create chats and messages tables

  1. New Tables
    - `chats`
      - `id` (uuid, primary key) - Unique identifier for each chat
      - `participant1_id` (text) - First participant (user slug/id)
      - `participant2_id` (text) - Second participant (user slug/id)
      - `created_at` (timestamptz) - When the chat was created
      - `updated_at` (timestamptz) - Last activity timestamp
    
    - `messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `chat_id` (uuid, foreign key) - Reference to the chat
      - `sender_id` (text) - Sender user slug/id
      - `text` (text) - Message content
      - `created_at` (timestamptz) - When the message was sent
      - `is_read` (boolean) - Whether message has been read
  
  2. Security
    - Enable RLS on both tables
    - Add public access policies (will be restricted later when auth is implemented)
  
  3. Important Notes
    - Using text for user IDs as the app uses slug-based identification
    - Composite unique constraint ensures only one chat between two users
    - Messages are ordered by created_at for display
    - Public access is temporary until proper authentication is implemented
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id text NOT NULL,
  participant2_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id),
  CONSTRAINT different_participants CHECK (participant1_id < participant2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_participant1 ON chats(participant1_id);
CREATE INDEX IF NOT EXISTS idx_chats_participant2 ON chats(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Temporary public access policies (to be replaced with proper auth later)
CREATE POLICY "Public can view chats"
  ON chats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create chats"
  ON chats FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update chats"
  ON chats FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update messages"
  ON messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete messages"
  ON messages FOR DELETE
  TO public
  USING (true);
