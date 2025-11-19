/*
  # Create reviews table

  ## Overview
  Creates a reviews table to store user reviews and integrates with existing review_helpful_votes table.

  ## New Table
  - `reviews`
    - `id` (uuid, primary key)
    - `reviewer_id` (uuid, user who wrote the review)
    - `reviewee_id` (uuid, user being reviewed)
    - `deal_id` (uuid, optional reference to deal)
    - `rating` (integer, 1-5 stars)
    - `comment` (text, review text)
    - `likes_count` (integer, cached count of likes)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on reviews table
  - Anyone can read reviews
  - Only authenticated users can create reviews
  - Users can only update/delete their own reviews

  ## Notes
  - likes_count is cached for performance
  - Updated via trigger when review_helpful_votes changes
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Add foreign key to review_helpful_votes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_helpful_votes_review_id_fkey'
  ) THEN
    ALTER TABLE review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_fkey
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Function to update likes_count
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET likes_count = likes_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET likes_count = likes_count - 1
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update likes_count
DROP TRIGGER IF EXISTS update_review_likes_count_trigger ON review_helpful_votes;
CREATE TRIGGER update_review_likes_count_trigger
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_likes_count();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user ON review_helpful_votes(user_id);
