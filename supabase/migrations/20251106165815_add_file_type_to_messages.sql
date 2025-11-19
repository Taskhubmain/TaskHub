/*
  # Add file type to messages

  1. Changes
    - Add file_type column to distinguish between image, video, and other files
    - This helps with proper rendering and preview in the UI
  
  2. File types
    - 'image' - for images (jpg, png, gif, etc)
    - 'video' - for videos (mp4, webm, etc)
    - 'file' - for other files (pdf, doc, etc)
    - null - for text-only messages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_type text CHECK (file_type IN ('image', 'video', 'file'));
  END IF;
END $$;
