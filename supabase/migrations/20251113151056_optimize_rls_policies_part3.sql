/*
  # Optimize RLS Policies - Part 3: Deals and Reviews

  1. Changes
    - Optimize auth.uid() calls in deals, reviews, and blocked_users
*/

-- Deals: Drop old policies
DROP POLICY IF EXISTS "Clients can view their deals" ON deals;
DROP POLICY IF EXISTS "Freelancers can view their deals" ON deals;
DROP POLICY IF EXISTS "Clients can update their deals" ON deals;
DROP POLICY IF EXISTS "Freelancers can update their deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;

-- Deals: Recreate with optimized policies
CREATE POLICY "Clients can view their deals"
  ON deals
  FOR SELECT
  TO authenticated
  USING (client_id = (select auth.uid()));

CREATE POLICY "Freelancers can view their deals"
  ON deals
  FOR SELECT
  TO authenticated
  USING (freelancer_id = (select auth.uid()));

CREATE POLICY "Clients can update their deals"
  ON deals
  FOR UPDATE
  TO authenticated
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

CREATE POLICY "Freelancers can update their deals"
  ON deals
  FOR UPDATE
  TO authenticated
  USING (freelancer_id = (select auth.uid()))
  WITH CHECK (freelancer_id = (select auth.uid()));

CREATE POLICY "Authenticated users can create deals"
  ON deals
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Reviews: Drop old policies
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Reviews: Recreate with optimized policies
CREATE POLICY "Authenticated users can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = (select auth.uid()));

CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (reviewer_id = (select auth.uid()))
  WITH CHECK (reviewer_id = (select auth.uid()));

CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (reviewer_id = (select auth.uid()));

-- Blocked users: Drop old policies
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can view their blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;

-- Blocked users: Recreate with optimized policies
CREATE POLICY "Users can block others"
  ON blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = (select auth.uid()));

CREATE POLICY "Users can view their blocks"
  ON blocked_users
  FOR SELECT
  TO authenticated
  USING (blocker_id = (select auth.uid()));

CREATE POLICY "Users can unblock others"
  ON blocked_users
  FOR DELETE
  TO authenticated
  USING (blocker_id = (select auth.uid()));
