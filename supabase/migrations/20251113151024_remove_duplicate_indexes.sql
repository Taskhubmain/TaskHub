/*
  # Remove Duplicate Indexes

  1. Changes
    - Drop duplicate indexes on review_helpful_votes table
    - Keep the more descriptive index names

  2. Performance Impact
    - Reduces storage usage
    - Simplifies index maintenance
    - No impact on query performance (identical indexes)
*/

-- Drop duplicate indexes, keep the more descriptive ones
DROP INDEX IF EXISTS idx_review_votes_review;
DROP INDEX IF EXISTS idx_review_votes_user;

-- Keep: idx_review_helpful_votes_review_id
-- Keep: idx_review_helpful_votes_user_id
