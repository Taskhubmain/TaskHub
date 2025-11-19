/*
  # Add full profile fields

  ## Overview
  Adds comprehensive profile fields to store all user information visible in the "About" section.

  ## New Fields
  - `headline` - Short professional headline/tagline
  - `location` - User's location/city
  - `rate_min` - Minimum hourly rate
  - `rate_max` - Maximum hourly rate
  - `currency` - Currency for rates (USD, EUR, etc)
  - `skills` - Array of skills/technologies
  - `contact_telegram` - Telegram handle
  - `about` - Short about section
  
  ## Notes
  - All fields are optional (nullable) to allow gradual profile completion
  - Skills stored as text array for easy querying and display
  - Rates stored as integers (in currency's minor units if needed)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'headline'
  ) THEN
    ALTER TABLE profiles ADD COLUMN headline text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'rate_min'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rate_min integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'rate_max'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rate_max integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contact_telegram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_telegram text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'about'
  ) THEN
    ALTER TABLE profiles ADD COLUMN about text DEFAULT '';
  END IF;
END $$;
