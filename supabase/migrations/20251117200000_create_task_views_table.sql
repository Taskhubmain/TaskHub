/*
  # Create Task Views Tracking System

  1. New Tables
    - `task_views`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references tasks)
      - `user_id` (uuid, references profiles) - nullable for anonymous views
      - `ip_address` (text) - for tracking anonymous views
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can insert view records
    - Only the task owner can read view statistics

  3. Indexes
    - Index on task_id for aggregation
    - Unique index on task_id + user_id to prevent duplicate views from same user
    - Index on task_id + ip_address for anonymous tracking

  4. Notes
    - Views are counted uniquely per user (one view per user per task)
    - Anonymous views are tracked by IP address
*/

CREATE TABLE IF NOT EXISTS task_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE task_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert task views"
  ON task_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Task owners can view task statistics"
  ON task_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_views.task_id
      AND tasks.user_id = auth.uid()
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE INDEX IF NOT EXISTS idx_task_views_task_id ON task_views(task_id);
CREATE INDEX IF NOT EXISTS idx_task_views_created_at ON task_views(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_views_user_unique ON task_views(task_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_views_ip_unique ON task_views(task_id, ip_address) WHERE user_id IS NULL AND ip_address IS NOT NULL;
