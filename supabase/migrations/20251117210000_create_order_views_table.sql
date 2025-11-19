/*
  # Create Order Views Tracking System

  1. New Tables
    - `order_views`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `user_id` (uuid, references profiles) - nullable for anonymous views
      - `ip_address` (text) - for tracking anonymous views
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can insert view records
    - Only the order owner can read view statistics

  3. Indexes
    - Index on order_id for aggregation
    - Unique index on order_id + user_id to prevent duplicate views from same user
    - Index on order_id + ip_address for anonymous tracking
*/

CREATE TABLE IF NOT EXISTS order_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE order_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order views"
  ON order_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Order owners can view order statistics"
  ON order_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_views.order_id
      AND orders.user_id = auth.uid()
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE INDEX IF NOT EXISTS idx_order_views_order_id ON order_views(order_id);
CREATE INDEX IF NOT EXISTS idx_order_views_created_at ON order_views(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_views_user_unique ON order_views(order_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_views_ip_unique ON order_views(order_id, ip_address) WHERE user_id IS NULL AND ip_address IS NOT NULL;
