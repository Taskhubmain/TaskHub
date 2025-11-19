/*
  # Add trigger to increment unread count on message insert

  1. Changes
    - Create function to increment unread count when new message is inserted
    - Create trigger on messages table to call the function
  
  2. Purpose
    - Automatically increment unread_count_p1 or unread_count_p2 when new message arrives
    - Ensure recipient's unread count increases even if their page is not loaded
    - Update last_message_at and last_message_text in chats table
*/

-- Function to increment unread count when new message is inserted
CREATE OR REPLACE FUNCTION increment_unread_on_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  chat_record RECORD;
BEGIN
  -- Get the chat record
  SELECT participant1_id, participant2_id, unread_count_p1, unread_count_p2
  INTO chat_record
  FROM chats
  WHERE id = NEW.chat_id;

  -- Increment unread count for the recipient (not the sender)
  IF chat_record.participant1_id = NEW.sender_id THEN
    -- Sender is participant1, so increment count for participant2
    UPDATE chats
    SET 
      unread_count_p2 = unread_count_p2 + 1,
      last_message_at = NEW.created_at,
      last_message_text = COALESCE(NEW.text, 
        CASE 
          WHEN NEW.file_type = 'image' THEN '📷 Изображение'
          WHEN NEW.file_type = 'video' THEN '🎥 Видео'
          WHEN NEW.file_url IS NOT NULL THEN '📎 Файл'
          ELSE ''
        END
      )
    WHERE id = NEW.chat_id;
  ELSIF chat_record.participant2_id = NEW.sender_id THEN
    -- Sender is participant2, so increment count for participant1
    UPDATE chats
    SET 
      unread_count_p1 = unread_count_p1 + 1,
      last_message_at = NEW.created_at,
      last_message_text = COALESCE(NEW.text,
        CASE 
          WHEN NEW.file_type = 'image' THEN '📷 Изображение'
          WHEN NEW.file_type = 'video' THEN '🎥 Видео'
          WHEN NEW.file_url IS NOT NULL THEN '📎 Файл'
          ELSE ''
        END
      )
    WHERE id = NEW.chat_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_increment_unread_on_message_insert ON messages;
CREATE TRIGGER trigger_increment_unread_on_message_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_on_message_insert();