/*
  # Add Monthly Proposal Limits

  ## Overview
  Implements a 90 proposal/month limit for orders (tasks remain unlimited)
  
  ## New Fields
  - `proposals_used_this_month` - Counter for proposals used in current month
  - `proposals_month_start` - Timestamp when current month started (for reset tracking)
  
  ## Details
  1. New Columns
    - `proposals_used_this_month` (integer, default 0) - Tracks proposals sent this month
    - `proposals_month_start` (timestamptz) - Month period start for tracking
  
  2. Constants
    - Monthly limit: 90 proposals for orders
    - Tasks: Unlimited (no limit applied)
  
  3. Important Notes
    - Limit applies only to proposals on ORDERS
    - Proposals on TASKS are unlimited
    - Counter resets monthly (tracked via proposals_month_start)
    - Frontend will check limit before allowing proposal creation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'proposals_used_this_month'
  ) THEN
    ALTER TABLE profiles ADD COLUMN proposals_used_this_month integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'proposals_month_start'
  ) THEN
    ALTER TABLE profiles ADD COLUMN proposals_month_start timestamptz DEFAULT date_trunc('month', now());
  END IF;
END $$;

-- Function to increment proposal counter (only for orders)
CREATE OR REPLACE FUNCTION increment_proposal_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count proposals on orders (not tasks)
  IF NEW.order_id IS NOT NULL THEN
    -- Check if we need to reset the monthly counter
    UPDATE profiles
    SET 
      proposals_used_this_month = CASE
        WHEN date_trunc('month', now()) > date_trunc('month', proposals_month_start)
        THEN 1
        ELSE proposals_used_this_month + 1
      END,
      proposals_month_start = CASE
        WHEN date_trunc('month', now()) > date_trunc('month', proposals_month_start)
        THEN date_trunc('month', now())
        ELSE proposals_month_start
      END
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment counter when proposal is created
DROP TRIGGER IF EXISTS trigger_increment_proposal_count ON proposals;
CREATE TRIGGER trigger_increment_proposal_count
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION increment_proposal_count();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_proposal_tracking 
  ON profiles(proposals_used_this_month, proposals_month_start);
