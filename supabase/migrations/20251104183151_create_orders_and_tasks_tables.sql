/*
  # Create Orders and Tasks Tables

  1. New Tables
    - `orders` (заказы от клиентов)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, название заказа)
      - `description` (text, описание)
      - `category` (text, категория)
      - `price_min` (integer, минимальная цена)
      - `price_max` (integer, максимальная цена)
      - `currency` (text, валюта)
      - `engagement` (text, тип занятости)
      - `deadline` (date, дедлайн)
      - `tags` (text[], массив тегов)
      - `is_boosted` (boolean, продвинутое объявление)
      - `boost_commission_rate` (numeric, комиссия за буст)
      - `use_escrow` (boolean, использовать эскроу)
      - `status` (text, статус: open, in_progress, completed, cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tasks` (объявления от фрилансеров)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, название)
      - `description` (text, описание)
      - `category` (text, категория)
      - `price` (integer, цена)
      - `currency` (text, валюта)
      - `delivery_days` (integer, срок выполнения в днях)
      - `tags` (text[], массив тегов)
      - `features` (text[], что входит)
      - `is_boosted` (boolean, продвинутое объявление)
      - `boost_commission_rate` (numeric, комиссия за буст)
      - `status` (text, статус: active, paused, deleted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - View all active orders and tasks
      - Create their own orders and tasks
      - Update/delete only their own orders and tasks
    - Add policies for anonymous users to view active listings

  3. Important Notes
    - Orders represent client requests for work
    - Tasks represent freelancer service offerings
    - Both support boost feature for premium placement
    - Tags stored as array for flexible searching
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  price_min integer NOT NULL,
  price_max integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  engagement text NOT NULL DEFAULT 'Фикс-прайс',
  deadline date,
  tags text[] DEFAULT '{}',
  is_boosted boolean DEFAULT false,
  boost_commission_rate numeric(5,2) DEFAULT 0.00,
  use_escrow boolean DEFAULT true,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  price integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  delivery_days integer NOT NULL,
  tags text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  is_boosted boolean DEFAULT false,
  boost_commission_rate numeric(5,2) DEFAULT 0.00,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Anyone can view active orders"
  ON orders FOR SELECT
  USING (status = 'open');

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Anyone can view active tasks"
  ON tasks FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_is_boosted ON orders(is_boosted);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_is_boosted ON tasks(is_boosted);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();