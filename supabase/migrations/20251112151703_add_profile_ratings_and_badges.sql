/*
  # Add Profile Ratings and Badges

  1. Updates to profiles table
    - `avg_rating` (numeric, average rating from reviews)
    - `reviews_count` (integer, total number of reviews)
    - `five_star_count` (integer, count of 5-star completed orders for badge logic)

  2. Important Notes
    - avg_rating and reviews_count are calculated from the reviews table
    - five_star_count tracks completed orders with 5-star ratings for badge display
    - "Новый исполнитель" badge: shown for first week after registration (calculated from created_at)
    - "Проверенный специалист" badge: shown when five_star_count >= 5
    - "Мастер своего дела" badge: shown when five_star_count >= 50
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avg_rating numeric(3,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reviews_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'five_star_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN five_star_count integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update profile ratings when a review is created/updated
CREATE OR REPLACE FUNCTION update_profile_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update avg_rating and reviews_count
  UPDATE profiles
  SET
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE freelancer_id = NEW.freelancer_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE freelancer_id = NEW.freelancer_id
    ),
    five_star_count = (
      SELECT COUNT(*)
      FROM reviews r
      JOIN deals d ON r.deal_id = d.id
      WHERE r.freelancer_id = NEW.freelancer_id
        AND r.rating = 5
        AND d.status = 'completed'
    )
  WHERE id = NEW.freelancer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings on review insert/update
DROP TRIGGER IF EXISTS update_ratings_on_review ON reviews;
CREATE TRIGGER update_ratings_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_ratings();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_avg_rating ON profiles(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_five_star_count ON profiles(five_star_count DESC);
