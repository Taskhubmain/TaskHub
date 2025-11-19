-- Проверка применения миграции для рейтингов и бейджей

-- 1. Проверить, что поля добавлены в таблицу profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('avg_rating', 'reviews_count', 'five_star_count')
ORDER BY column_name;

-- 2. Проверить текущие данные профилей
SELECT
  id,
  name,
  avg_rating,
  reviews_count,
  five_star_count,
  created_at,
  CASE
    WHEN five_star_count >= 50 THEN '👑 Мастер своего дела'
    WHEN five_star_count >= 5 THEN '✅ Проверенный специалист'
    WHEN (now() - created_at) < interval '7 days' THEN '🆕 Недавно на бирже'
    ELSE 'Нет бейджа'
  END as badge_status
FROM profiles
WHERE role = 'FREELANCER'
ORDER BY five_star_count DESC, avg_rating DESC
LIMIT 10;

-- 3. Статистика по бейджам
SELECT
  CASE
    WHEN five_star_count >= 50 THEN 'Мастер своего дела'
    WHEN five_star_count >= 5 THEN 'Проверенный специалист'
    WHEN (now() - created_at) < interval '7 days' THEN 'Недавно на бирже'
    ELSE 'Нет бейджа'
  END as badge_type,
  COUNT(*) as count
FROM profiles
WHERE role = 'FREELANCER'
GROUP BY
  CASE
    WHEN five_star_count >= 50 THEN 'Мастер своего дела'
    WHEN five_star_count >= 5 THEN 'Проверенный специалист'
    WHEN (now() - created_at) < interval '7 days' THEN 'Недавно на бирже'
    ELSE 'Нет бейджа'
  END
ORDER BY count DESC;
