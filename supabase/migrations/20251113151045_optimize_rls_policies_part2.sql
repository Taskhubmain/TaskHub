/*
  # Optimize RLS Policies - Part 2: Profiles and Portfolio

  1. Changes
    - Optimize auth.uid() calls in profiles, portfolio_projects, and review_helpful_votes
*/

-- Profiles: Drop old policies
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Profiles: Recreate with optimized policies
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Portfolio: Drop old policies
DROP POLICY IF EXISTS "Users can create own portfolio projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can update own portfolio projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can delete own portfolio projects" ON portfolio_projects;

-- Portfolio: Recreate with optimized policies
CREATE POLICY "Users can create own portfolio projects"
  ON portfolio_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own portfolio projects"
  ON portfolio_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own portfolio projects"
  ON portfolio_projects
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Review votes: Drop old policies
DROP POLICY IF EXISTS "Authenticated users can vote" ON review_helpful_votes;
DROP POLICY IF EXISTS "Users can remove own votes" ON review_helpful_votes;

-- Review votes: Recreate with optimized policies
CREATE POLICY "Authenticated users can vote"
  ON review_helpful_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can remove own votes"
  ON review_helpful_votes
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
