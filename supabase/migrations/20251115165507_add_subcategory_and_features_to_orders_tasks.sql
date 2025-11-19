/*
  # Add subcategory and features fields to orders and tasks

  ## Changes
  1. Add `subcategory` (text) field to orders table
  2. Add `subcategory` (text) field to tasks table
  3. Add `features` (text[]) field to tasks table for selected parameters

  ## Notes
  - Subcategory will store the subcategory name for filtering
  - Features array will store selected 'What's included' parameters
*/

-- Add subcategory to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE orders ADD COLUMN subcategory text;
  END IF;
END $$;

-- Add subcategory to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subcategory text;
  END IF;
END $$;

-- Create index for filtering by subcategory
CREATE INDEX IF NOT EXISTS idx_orders_subcategory ON orders(subcategory);
CREATE INDEX IF NOT EXISTS idx_tasks_subcategory ON tasks(subcategory);
