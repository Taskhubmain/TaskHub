-- Seed test data for profile badges
-- This script adds test data to demonstrate different badge levels

-- Update some existing profiles with different badge levels
-- Note: Replace UUIDs with actual user IDs from your database

-- Example: User with "Проверенный специалист" (5 five-star reviews)
UPDATE profiles
SET
  avg_rating = 5.0,
  reviews_count = 7,
  five_star_count = 5
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'FREELANCER' LIMIT 1 OFFSET 0
);

-- Example: User with "Мастер своего дела" (50 five-star reviews)
UPDATE profiles
SET
  avg_rating = 4.95,
  reviews_count = 58,
  five_star_count = 52
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'FREELANCER' LIMIT 1 OFFSET 1
);

-- Example: User with good rating but no badge yet (3 five-star reviews)
UPDATE profiles
SET
  avg_rating = 4.8,
  reviews_count = 5,
  five_star_count = 3
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'FREELANCER' LIMIT 1 OFFSET 2
);

-- Example: New user (registered recently, will show "Недавно на бирже")
UPDATE profiles
SET
  avg_rating = 0,
  reviews_count = 0,
  five_star_count = 0,
  created_at = now() - interval '3 days'
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'FREELANCER' LIMIT 1 OFFSET 3
);

-- Example: User with mixed reviews
UPDATE profiles
SET
  avg_rating = 4.2,
  reviews_count = 15,
  five_star_count = 8
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'FREELANCER' LIMIT 1 OFFSET 4
);

-- Display updated profiles for verification
SELECT
  id,
  name,
  avg_rating,
  reviews_count,
  five_star_count,
  created_at,
  CASE
    WHEN five_star_count >= 50 THEN 'Мастер своего дела'
    WHEN five_star_count >= 5 THEN 'Проверенный специалист'
    WHEN (now() - created_at) < interval '7 days' THEN 'Недавно на бирже'
    ELSE 'No badge'
  END as badge_status
FROM profiles
WHERE role = 'FREELANCER'
ORDER BY five_star_count DESC
LIMIT 10;
