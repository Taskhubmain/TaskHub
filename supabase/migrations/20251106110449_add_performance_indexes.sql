/*
  # Add performance indexes

  ## Overview
  Creates indexes on frequently queried columns to improve query performance.

  ## New Indexes
  - orders: status, created_at
  - tasks: status, created_at
  - messages: chat_id, created_at
  - chats: participant1_id, participant2_id
  - deals: client_id, freelancer_id, status
  - proposals: order_id, task_id, user_id, status

  ## Notes
  - Composite indexes for common query patterns
  - Single column indexes for filtering
  - These will significantly improve page load times
*/

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_participant1 ON chats(participant1_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participant2 ON chats(participant2_id, updated_at DESC);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_client_status ON deals(client_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_freelancer_status ON deals(freelancer_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_created ON deals(created_at DESC);

-- Proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_order_status ON proposals(order_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_task_status ON proposals(task_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals(user_id, created_at DESC);

-- Profiles index for name search
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
