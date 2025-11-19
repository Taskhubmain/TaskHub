/*
  # Fix Review Trigger - Replace freelancer_id with reviewee_id

  ## Changes
  Updates the `update_profile_ratings()` function to use `reviewee_id` instead of `freelancer_id`
  since the reviews table uses `reviewee_id` to reference the user being reviewed.

  ## Details
  - Replaces all occurrences of `NEW.freelancer_id` with `NEW.reviewee_id`
  - Replaces all occurrences of `r.freelancer_id` with `r.reviewee_id`
  - Maintains the same logic for calculating avg_rating, reviews_count, and five_star_count
*/

-- Drop and recreate the function with correct field name
DROP FUNCTION IF EXISTS update_profile_ratings() CASCADE;

CREATE OR REPLACE FUNCTION update_profile_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update avg_rating and reviews_count
  UPDATE profiles
  SET
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    five_star_count = (
      SELECT COUNT(*)
      FROM reviews r
      JOIN deals d ON r.deal_id = d.id
      WHERE r.reviewee_id = NEW.reviewee_id
        AND r.rating = 5
        AND d.status = 'completed'
    )
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_ratings_on_review ON reviews;
CREATE TRIGGER update_ratings_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_ratings();
