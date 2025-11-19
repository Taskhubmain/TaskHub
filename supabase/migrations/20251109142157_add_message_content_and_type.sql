/*
  # Add content and type fields to messages table

  1. Changes
    - Add `content` column (same as text, for compatibility)
    - Add `type` column to distinguish between system and regular messages
    - Make `text` nullable to support system messages that use content

  2. Message Types
    - 'system' - System-generated messages (deal creation, etc)
    - 'text' - Regular user messages (default)
    - null - Legacy messages (treated as 'text')

  3. Content vs Text
    - `content` is used for storing message text going forward
    - `text` is kept for backward compatibility
    - When both exist, `content` takes precedence
*/

-- Add content column (copy of text data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'content'
  ) THEN
    ALTER TABLE messages ADD COLUMN content text;
    -- Copy existing text data to content
    UPDATE messages SET content = text WHERE content IS NULL;
  END IF;
END $$;

-- Add type column for message types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'type'
  ) THEN
    ALTER TABLE messages ADD COLUMN type text CHECK (type IN ('system', 'text'));
    -- Set default type for existing messages
    UPDATE messages SET type = 'text' WHERE type IS NULL;
  END IF;
END $$;

-- Make text column nullable (for system messages that might only use content)
ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;
