/*
  # Create Chat Reports Table

  1. New Tables
    - `chat_reports`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `reporter_id` (uuid, references profiles) - кто подал жалобу
      - `reported_user_id` (uuid, references profiles) - на кого подали жалобу
      - `reason` (text) - причина жалобы
      - `status` (text) - статус: pending, reviewed, resolved, rejected
      - `admin_notes` (text) - заметки админа
      - `reviewed_by` (uuid, references profiles) - кто рассмотрел
      - `reviewed_at` (timestamptz) - когда рассмотрено
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can create reports about their chats
    - Users can view their own reports
    - Admins can view and manage all reports

  3. Indexes
    - Index on chat_id for fast lookups
    - Index on reporter_id for user reports
    - Index on reported_user_id for reported users
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports for their chats"
  ON chat_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_reports.chat_id
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can view their own reports"
  ON chat_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Admins can update reports"
  ON chat_reports FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE INDEX IF NOT EXISTS idx_chat_reports_chat_id ON chat_reports(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter_id ON chat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported_user_id ON chat_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_reports_created_at ON chat_reports(created_at DESC);
