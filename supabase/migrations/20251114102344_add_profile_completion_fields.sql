/*
  # Add Profile Completion Fields

  ## Overview
  Adds missing profile fields for the registration completion page:
  - Age
  - Specialty (profession)
  - Experience (years)
  - Contact Gmail
  - Profile completion status

  ## New Fields
  - `age` - User's age (integer)
  - `specialty` - User's profession/specialty (text)
  - `experience_years` - Years of work experience (integer)
  - `contact_gmail` - Contact Gmail address (text)
  - `profile_completed` - Whether user completed profile setup (boolean)
  - `avatar_url` - Already exists but ensuring it's available for photo upload

  ## Notes
  - All fields are optional initially
  - profile_completed tracks if user finished onboarding
  - Fields integrate with existing location, telegram, skills, rates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialty text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'experience_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience_years integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contact_gmail'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_gmail text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;
END $$;
