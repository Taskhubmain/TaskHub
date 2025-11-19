/*
  # Add user presence and typing indicators

  1. Changes to profiles table
    - `last_seen_at` (timestamptz) - Last time user was online
    - `is_online` (boolean) - Whether user is currently online
  
  2. New table: typing_indicators
    - `id` (uuid, primary key)
    - `chat_id` (uuid, foreign key) - Chat where user is typing
    - `user_id` (uuid, foreign key) - User who is typing
    - `updated_at` (timestamptz) - Last typing activity timestamp
    - Unique constraint on (chat_id, user_id)
  
  3. Security
    - Enable RLS on typing_indicators
    - Users can insert/update their own typing status
    - Users can view typing status in their chats
  
  4. Indexes
    - Index on chat_id for fast lookup
    - Index on updated_at for cleanup of old records
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
  END IF;
END $$;

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_chat_user_typing UNIQUE (chat_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_chat ON typing_indicators(chat_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated ON typing_indicators(updated_at);

-- Enable RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own typing status
CREATE POLICY "Users can manage own typing status"
  ON typing_indicators FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view typing status in their chats
CREATE POLICY "Users can view typing in their chats"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = typing_indicators.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

-- Enable realtime for typing_indicators
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
