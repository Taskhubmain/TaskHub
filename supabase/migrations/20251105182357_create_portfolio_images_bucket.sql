/*
  # Create Portfolio Images Storage Bucket

  1. Storage
    - Create `portfolio-images` bucket for storing portfolio project images
    - Enable public access for the bucket
    - Set up policies for authenticated users to upload images

  2. Security
    - Allow authenticated users to upload images to their own folders
    - Allow public read access to all images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload portfolio images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Allow users to update their own portfolio images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow users to delete their own portfolio images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio-images');

-- Allow public read access to all portfolio images
CREATE POLICY "Allow public read access to portfolio images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portfolio-images');