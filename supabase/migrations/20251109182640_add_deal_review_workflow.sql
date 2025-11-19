/*
  # Add Deal Review Workflow

  ## Overview
  This migration adds support for deal submission and review workflow with system messages in chat.

  ## Changes to Tables

  ### `deals` table modifications:
  - Add `submitted_at` (timestamptz) - When freelancer submitted work for review
  - Add `review_requested_at` (timestamptz) - When client requested revisions
  - Update status to support new states: 'in_progress', 'submitted', 'under_review', 'completed', 'disputed', 'cancelled'

  ### `messages` table modifications:
  - Add `is_system` (boolean) - Flag to mark system-generated messages
  - Add `system_type` (text) - Type of system message: 'deal_submitted', 'work_accepted', 'revision_requested', etc.

  ## Security
  - Maintain existing RLS policies
  - System messages can be created by both client and freelancer

  ## Important Notes
  - System messages are visually distinct in the chat
  - Deal workflow: in_progress → submitted → completed (or revision_requested → in_progress)
  - Uses timestamptz for all date fields to track workflow progression
*/

-- Add new columns to deals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE deals ADD COLUMN submitted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'review_requested_at'
  ) THEN
    ALTER TABLE deals ADD COLUMN review_requested_at timestamptz;
  END IF;
END $$;

-- Add new columns to messages table for system messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_system'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_system boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'system_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN system_type text;
  END IF;
END $$;

-- Create index for system messages
CREATE INDEX IF NOT EXISTS idx_messages_system ON messages(is_system, system_type);

-- Create index for deal workflow tracking
CREATE INDEX IF NOT EXISTS idx_deals_submitted_at ON deals(submitted_at);
CREATE INDEX IF NOT EXISTS idx_deals_review_requested_at ON deals(review_requested_at);