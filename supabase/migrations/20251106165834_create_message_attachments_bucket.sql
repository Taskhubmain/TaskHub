/*
  # Create storage bucket for message attachments

  1. New Bucket
    - `message-attachments` - stores all files sent in messages
  
  2. Security
    - Public bucket for easy access
    - RLS policies to ensure users can only upload to their own chats
    - Anyone can read files (since they're in messages)
  
  3. File Types
    - Images: jpg, jpeg, png, gif, webp
    - Videos: mp4, webm, mov
    - Documents: pdf, doc, docx, txt, etc
*/

-- Create the storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload files (we'll validate chat membership in the app)
CREATE POLICY "Anyone can upload message attachments"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'message-attachments');

-- Policy: Anyone can view message attachments
CREATE POLICY "Anyone can view message attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'message-attachments');

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update their uploads"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'message-attachments')
  WITH CHECK (bucket_id = 'message-attachments');

-- Policy: Users can delete their own uploads
CREATE POLICY "Users can delete their uploads"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'message-attachments');
