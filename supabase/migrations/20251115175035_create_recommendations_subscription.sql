/*
  # Create Recommendations Subscription System

  1. New Tables
    - `recommendations_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `plan_type` (text: '1month', '3months', '1year')
      - `started_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
      - `price_paid` (integer)
      - `created_at` (timestamptz)
    
    - `order_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `order_id` (uuid, references orders)
      - `match_score` (integer, 0-100)
      - `match_reasons` (jsonb)
      - `created_at` (timestamptz)
      - `is_visible` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Functions
    - Add function to check subscription status
    - Add function to clean up invisible recommendations
*/

-- Create recommendations_subscriptions table
CREATE TABLE IF NOT EXISTS recommendations_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('1month', '3months', '1year')),
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  price_paid integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create order_recommendations table
CREATE TABLE IF NOT EXISTS order_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  UNIQUE(user_id, order_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_subscriptions_user_id ON recommendations_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_subscriptions_expires_at ON recommendations_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_recommendations_user_id ON order_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_order_recommendations_order_id ON order_recommendations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_recommendations_is_visible ON order_recommendations(is_visible);

-- Enable RLS
ALTER TABLE recommendations_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON recommendations_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON recommendations_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_recommendations
CREATE POLICY "Users can view own recommendations"
  ON order_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_visible = true);

CREATE POLICY "System can manage recommendations"
  ON order_recommendations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_recommendations_subscription(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM recommendations_subscriptions
    WHERE user_id = p_user_id
      AND is_active = true
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription days remaining
CREATE OR REPLACE FUNCTION get_subscription_days_remaining(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_expires_at timestamptz;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM recommendations_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF v_expires_at IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(0, EXTRACT(DAY FROM (v_expires_at - now()))::integer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hide recommendations for taken/deleted orders
CREATE OR REPLACE FUNCTION cleanup_invalid_recommendations()
RETURNS void AS $$
BEGIN
  -- Hide recommendations for orders that are no longer open
  UPDATE order_recommendations
  SET is_visible = false
  WHERE is_visible = true
    AND order_id IN (
      SELECT id FROM orders
      WHERE status != 'open'
    );

  -- Hide recommendations for deleted orders (handled by CASCADE)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add columns to profiles for subscription tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'recommendations_subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN recommendations_subscription_expires_at timestamptz;
  END IF;
END $$;

-- Enable realtime for recommendations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'order_recommendations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_recommendations;
  END IF;
END $$;
