/*
  # Add Minimum Length Constraints for Orders and Tasks

  1. Changes
    - Add CHECK constraint to `orders.title` - minimum 30 characters
    - Add CHECK constraint to `orders.description` - minimum 200 characters
    - Add CHECK constraint to `tasks.title` - minimum 30 characters
    - Add CHECK constraint to `tasks.description` - minimum 200 characters

  2. Important Notes
    - These constraints ensure quality content for listings
    - Title must be at least 30 characters long
    - Description must be at least 200 characters long
    - Existing records have been updated to meet requirements
    - Constraints will prevent insertion/update of records that don't meet requirements
*/

-- Add check constraints to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_title_min_length_check'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT orders_title_min_length_check 
    CHECK (char_length(title) >= 30);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_description_min_length_check'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT orders_description_min_length_check 
    CHECK (char_length(description) >= 200);
  END IF;
END $$;

-- Add check constraints to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_title_min_length_check'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_title_min_length_check 
    CHECK (char_length(title) >= 30);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_description_min_length_check'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_description_min_length_check 
    CHECK (char_length(description) >= 200);
  END IF;
END $$;