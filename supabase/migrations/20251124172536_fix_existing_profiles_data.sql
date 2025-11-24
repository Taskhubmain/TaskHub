/*
  # Fix Existing Profiles Data Without Creating New Rows

  1. Changes
    - Update existing profiles with missing data from auth.users
    - Fix null names, avatars, and other fields
    - Add documentation comments

  2. Security
    - No new rows created (avoids trigger issues)
    - Only updates existing profiles
*/

-- =============================================
-- 1. UPDATE EXISTING PROFILES WITH MISSING DATA
-- =============================================

-- Update profiles that have null or empty values with data from auth.users metadata
UPDATE public.profiles p
SET 
  name = CASE 
    WHEN p.name IS NULL OR trim(p.name) = '' THEN
      COALESCE(
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
      )
    ELSE p.name
  END,
  avatar_url = CASE
    WHEN p.avatar_url IS NULL OR trim(p.avatar_url) = '' THEN
      COALESCE(
        u.raw_user_meta_data->>'avatar_url',
        u.raw_user_meta_data->>'picture',
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E'
      )
    ELSE p.avatar_url
  END,
  specialty = COALESCE(p.specialty, 'не указана'),
  experience_years = COALESCE(p.experience_years, 0),
  skills = COALESCE(p.skills, ARRAY['не указаны']),
  location = COALESCE(p.location, 'не указана'),
  contact_telegram = COALESCE(p.contact_telegram, 'не указан'),
  contact_gmail = COALESCE(p.contact_gmail, 'не указан'),
  bio = COALESCE(p.bio, 'Привет! Я использую TaskHub'),
  profile_completed = COALESCE(p.profile_completed, false),
  role = COALESCE(p.role, u.raw_user_meta_data->>'role', 'FREELANCER')
FROM auth.users u
WHERE p.id = u.id;

-- =============================================
-- 2. ADD DOCUMENTATION
-- =============================================

-- Add comments explaining what ProfileCompletion should save
COMMENT ON COLUMN profiles.name IS 'User name from registration metadata or ProfileCompletion';
COMMENT ON COLUMN profiles.specialty IS 'User specialty/profession from ProfileCompletion';
COMMENT ON COLUMN profiles.experience_years IS 'Years of experience from ProfileCompletion';
COMMENT ON COLUMN profiles.age IS 'User age from ProfileCompletion';
COMMENT ON COLUMN profiles.rate_min IS 'Minimum hourly rate from ProfileCompletion';
COMMENT ON COLUMN profiles.rate_max IS 'Maximum hourly rate from ProfileCompletion';
COMMENT ON COLUMN profiles.currency IS 'Currency for rates from ProfileCompletion';
COMMENT ON COLUMN profiles.skills IS 'Array of skills/technologies from ProfileCompletion';
COMMENT ON COLUMN profiles.location IS 'User location from ProfileCompletion';
COMMENT ON COLUMN profiles.contact_telegram IS 'Telegram contact from ProfileCompletion';
COMMENT ON COLUMN profiles.contact_gmail IS 'Gmail contact from ProfileCompletion';
COMMENT ON COLUMN profiles.bio IS 'User bio/description from ProfileCompletion';
COMMENT ON COLUMN profiles.avatar_url IS 'Avatar photo URL uploaded in ProfileCompletion or from OAuth';
COMMENT ON COLUMN profiles.profile_completed IS 'Whether user completed ProfileCompletion page';
