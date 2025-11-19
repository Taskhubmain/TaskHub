/*
  # Add file support to messages

  ## Changes
  - Add file_url column to store uploaded file URL
  - Add file_name column to store original file name

  ## Notes
  - Allows users to send files in messages
  - Files will be stored in Supabase Storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_name text;
  END IF;
END $$;
