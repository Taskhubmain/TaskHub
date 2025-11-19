/*
  # Optimize RLS Policies - Part 6: Proposal Options and Deal Progress

  1. Changes
    - Optimize auth.uid() calls in proposal_options, deal_progress_reports, deal_task_items, deal_time_extensions
*/

-- Proposal options: Drop old policies
DROP POLICY IF EXISTS "Users can view options for their proposals" ON proposal_options;
DROP POLICY IF EXISTS "Users can view options for proposals on their orders/tasks" ON proposal_options;
DROP POLICY IF EXISTS "Users can create options for their proposals" ON proposal_options;
DROP POLICY IF EXISTS "Users can update options for their proposals" ON proposal_options;
DROP POLICY IF EXISTS "Users can delete options for their proposals" ON proposal_options;

-- Proposal options: Recreate with optimized policies
CREATE POLICY "Users can view options for their proposals"
  ON proposal_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.freelancer_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view options for proposals on their orders/tasks"
  ON proposal_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      INNER JOIN orders ON orders.id = proposals.order_id
      WHERE proposals.id = proposal_options.proposal_id
      AND orders.user_id = (select auth.uid())
      UNION
      SELECT 1 FROM proposals
      INNER JOIN tasks ON tasks.id = proposals.task_id
      WHERE proposals.id = proposal_options.proposal_id
      AND tasks.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create options for their proposals"
  ON proposal_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.freelancer_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update options for their proposals"
  ON proposal_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.freelancer_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete options for their proposals"
  ON proposal_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_options.proposal_id
      AND proposals.freelancer_id = (select auth.uid())
    )
  );

-- Deal progress reports: Drop old policies
DROP POLICY IF EXISTS "Deal participants can view progress reports" ON deal_progress_reports;
DROP POLICY IF EXISTS "Freelancers can create progress reports" ON deal_progress_reports;

-- Deal progress reports: Recreate with optimized policies
CREATE POLICY "Deal participants can view progress reports"
  ON deal_progress_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_progress_reports.deal_id
      AND (deals.client_id = (select auth.uid()) OR deals.freelancer_id = (select auth.uid()))
    )
  );

CREATE POLICY "Freelancers can create progress reports"
  ON deal_progress_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_progress_reports.deal_id
      AND deals.freelancer_id = (select auth.uid())
    )
  );

-- Deal task items: Drop old policies
DROP POLICY IF EXISTS "Deal participants can view task items" ON deal_task_items;
DROP POLICY IF EXISTS "Freelancers can manage task items" ON deal_task_items;

-- Deal task items: Recreate with optimized policies
CREATE POLICY "Deal participants can view task items"
  ON deal_task_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_task_items.deal_id
      AND (deals.client_id = (select auth.uid()) OR deals.freelancer_id = (select auth.uid()))
    )
  );

CREATE POLICY "Freelancers can manage task items"
  ON deal_task_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_task_items.deal_id
      AND deals.freelancer_id = (select auth.uid())
    )
  );

-- Deal time extensions: Drop old policies
DROP POLICY IF EXISTS "Deal participants can view time extensions" ON deal_time_extensions;
DROP POLICY IF EXISTS "Freelancers can request time extensions" ON deal_time_extensions;
DROP POLICY IF EXISTS "Clients can update time extension status" ON deal_time_extensions;

-- Deal time extensions: Recreate with optimized policies
CREATE POLICY "Deal participants can view time extensions"
  ON deal_time_extensions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND (deals.client_id = (select auth.uid()) OR deals.freelancer_id = (select auth.uid()))
    )
  );

CREATE POLICY "Freelancers can request time extensions"
  ON deal_time_extensions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND deals.freelancer_id = (select auth.uid())
    )
  );

CREATE POLICY "Clients can update time extension status"
  ON deal_time_extensions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_time_extensions.deal_id
      AND deals.client_id = (select auth.uid())
    )
  );
