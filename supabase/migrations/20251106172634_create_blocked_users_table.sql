/*
  # Create blocked users table

  1. New Tables
    - `blocked_users`
      - `id` (uuid, primary key) - Unique identifier
      - `blocker_id` (uuid, foreign key) - User who is blocking
      - `blocked_id` (uuid, foreign key) - User who is blocked
      - `created_at` (timestamptz) - When the block was created
      - Unique constraint on (blocker_id, blocked_id)
  
  2. Security
    - Enable RLS on `blocked_users` table
    - Users can view their own blocks
    - Users can create blocks
    - Users can delete their own blocks
  
  3. Indexes
    - Index on blocker_id for fast lookup
    - Index on blocked_id for checking if user is blocked
*/

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);
