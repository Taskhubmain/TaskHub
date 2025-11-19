/*
  # Create Portfolio and Review Features

  1. New Tables
    - `portfolio_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text, project name)
      - `description` (text, project description)
      - `image_url` (text, project thumbnail)
      - `project_url` (text, optional link to live project)
      - `tags` (text[], technologies used)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `review_helpful_votes`
      - `id` (uuid, primary key)
      - `review_id` (uuid, references a review table that will be created)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (review_id, user_id) to prevent duplicate votes

  2. Security
    - Enable RLS on both tables
    - Portfolio: Anyone can view, only owner can create/update/delete
    - Review votes: Anyone can view, authenticated users can vote

  3. Important Notes
    - Portfolio projects support rich metadata including tags and images
    - Review helpful votes track which users found reviews helpful
    - Each user can only vote once per review
*/

-- Create portfolio_projects table
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  project_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create review_helpful_votes table (placeholder for future reviews table)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
CREATE POLICY "Anyone can view portfolio projects"
  ON portfolio_projects FOR SELECT
  USING (true);

CREATE POLICY "Users can create own portfolio projects"
  ON portfolio_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio projects"
  ON portfolio_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio projects"
  ON portfolio_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Review helpful votes policies
CREATE POLICY "Anyone can view review votes"
  ON review_helpful_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON review_helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_user_id ON portfolio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- Update trigger for portfolio_projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
