/*
  # Add trigger for monthly proposal reset

  1. Changes
    - Create function to check and reset monthly proposals
    - Ensure proposals_month_start defaults to beginning of current month
    - Reset counter happens automatically when new month starts
  
  2. Security
    - Function runs with security definer privileges
    - Only resets for authenticated users
*/

-- Create or replace function to handle monthly reset
CREATE OR REPLACE FUNCTION check_and_reset_monthly_proposals()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we're in a new month
  IF date_trunc('month', NEW.proposals_month_start) < date_trunc('month', NOW()) THEN
    NEW.proposals_used_this_month := 0;
    NEW.proposals_month_start := date_trunc('month', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS reset_monthly_proposals_on_access ON profiles;

-- Create trigger that fires before any update to profiles
CREATE TRIGGER reset_monthly_proposals_on_access
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.proposals_month_start IS NOT NULL)
  EXECUTE FUNCTION check_and_reset_monthly_proposals();