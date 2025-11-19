/*
  # Update CRM Context with Enhanced Task Support

  1. Changes
    - Rename `agreed_price` to `total_price` for better clarity
    - Tasks now support extended parameters: price, deadline, delivery_date
    - Add medium priority support

  2. Notes
    - This migration updates the existing structure
    - Uses ALTER TABLE to modify the column name
    - The jsonb tasks field will store objects with extended properties
    - Tasks structure: { title, status, description, price, deadline, delivery_date }
*/

-- Rename agreed_price to total_price
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_crm_context' AND column_name = 'agreed_price'
  ) THEN
    ALTER TABLE chat_crm_context RENAME COLUMN agreed_price TO total_price;
  END IF;
END $$;

-- Update priority default to support medium
DO $$
BEGIN
  ALTER TABLE chat_crm_context ALTER COLUMN priority SET DEFAULT 'medium';
END $$;
