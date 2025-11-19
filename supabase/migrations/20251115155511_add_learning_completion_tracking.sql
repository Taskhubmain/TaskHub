/*
  # Add Learning Completion Tracking

  ## Overview
  Adds learning progress tracking to profiles table to:
  - Track which lessons user has completed
  - Show "Прошел обучение" badge when all 10 lessons completed
  - Display "Обучение" tab in navbar for users who completed training

  ## New Fields
  - `completed_lessons` - Array of completed lesson IDs (integer array)
  - `learning_completed` - Whether user completed all 10 lessons (boolean)

  ## Notes
  - completed_lessons stores lesson IDs as integers [1,2,3,...]
  - learning_completed is auto-calculated when all 10 lessons done
  - Default values: empty array and false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'completed_lessons'
  ) THEN
    ALTER TABLE profiles ADD COLUMN completed_lessons integer[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'learning_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN learning_completed boolean DEFAULT false;
  END IF;
END $$;
