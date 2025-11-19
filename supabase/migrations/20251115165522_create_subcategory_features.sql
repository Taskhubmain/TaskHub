/*
  # Create subcategory features table

  ## Overview
  Stores feature options for each subcategory (up to 10 parameters per subcategory)

  ## New Tables
  1. `subcategory_features`
    - `id` (uuid, primary key)
    - `subcategory_id` (uuid, foreign key) - Reference to subcategory
    - `name` (text) - Feature name
    - `sort_order` (integer) - Display order
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS
  - Public read access
  - Admin-only write access
*/

-- Create subcategory_features table
CREATE TABLE IF NOT EXISTS subcategory_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subcategory_features ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view subcategory features"
  ON subcategory_features FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subcategory features"
  ON subcategory_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Add index
CREATE INDEX IF NOT EXISTS idx_subcategory_features_subcategory_id ON subcategory_features(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_features_sort_order ON subcategory_features(subcategory_id, sort_order);
