/*
  # Add chat last message tracking

  ## Overview
  Adds fields to track last message and unread counts for better UX.

  ## New Fields
  - `last_message_text` - Preview of last message
  - `last_message_at` - Timestamp of last message
  - `unread_count_p1` - Unread count for participant1
  - `unread_count_p2` - Unread count for participant2

  ## Notes
  - last_message_text helps show preview without extra query
  - Separate unread counters for each participant
  - Updated automatically via triggers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'last_message_text'
  ) THEN
    ALTER TABLE chats ADD COLUMN last_message_text text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE chats ADD COLUMN last_message_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'unread_count_p1'
  ) THEN
    ALTER TABLE chats ADD COLUMN unread_count_p1 integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'unread_count_p2'
  ) THEN
    ALTER TABLE chats ADD COLUMN unread_count_p2 integer DEFAULT 0;
  END IF;
END $$;

-- Function to update chat on new message
CREATE OR REPLACE FUNCTION update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message_text = COALESCE(NEW.text, 'Файл'),
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_count_p1 = CASE 
      WHEN NEW.sender_id = participant2_id THEN unread_count_p1 + 1
      ELSE unread_count_p1
    END,
    unread_count_p2 = CASE 
      WHEN NEW.sender_id = participant1_id THEN unread_count_p2 + 1
      ELSE unread_count_p2
    END
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat on new message
DROP TRIGGER IF EXISTS update_chat_on_message_trigger ON messages;
CREATE TRIGGER update_chat_on_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_on_message();

-- Function to reset unread count when messages are read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS void AS $$
BEGIN
  -- This function will be called from the app when user opens a chat
  RETURN;
END;
$$ LANGUAGE plpgsql;
