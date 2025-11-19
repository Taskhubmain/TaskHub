/*
  # Create Currencies and Exchange Rates Tables

  1. New Tables
    - `currencies`
      - `code` (text, primary key) - ISO currency code (USD, EUR, RUB, etc.)
      - `name` (text) - Full currency name
      - `symbol` (text) - Currency symbol ($, €, ₽, etc.)
      - `locale` (text) - Default locale for formatting
      - `is_active` (boolean) - Whether currency is available for selection
      - `created_at` (timestamptz) - Creation timestamp

    - `exchange_rates`
      - `id` (uuid, primary key)
      - `from_currency` (text, foreign key) - Base currency code
      - `to_currency` (text, foreign key) - Target currency code
      - `rate` (numeric) - Exchange rate value
      - `fetched_at` (timestamptz) - When rate was fetched
      - `created_at` (timestamptz) - Creation timestamp

    - `user_preferences`
      - `user_id` (uuid, primary key, foreign key) - User ID
      - `language` (text) - Preferred language (en, ru, etc.)
      - `currency` (text, foreign key) - Preferred currency code
      - `timezone` (text) - User timezone
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Public read access for currencies and exchange_rates
    - User preferences only accessible by owner

  3. Seed Data
    - Insert common currencies (USD, EUR, RUB, etc.)
*/

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  locale text NOT NULL DEFAULT 'en-US',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active currencies"
  ON currencies FOR SELECT
  USING (is_active = true);

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL REFERENCES currencies(code),
  to_currency text NOT NULL REFERENCES currencies(code),
  rate numeric(20, 8) NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency, fetched_at)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates FOR INSERT
  WITH CHECK (true);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  currency text NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
  timezone text DEFAULT 'UTC',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert common currencies
INSERT INTO currencies (code, name, symbol, locale, is_active) VALUES
  ('USD', 'US Dollar', '$', 'en-US', true),
  ('EUR', 'Euro', '€', 'de-DE', true),
  ('RUB', 'Russian Ruble', '₽', 'ru-RU', true),
  ('GBP', 'British Pound', '£', 'en-GB', true),
  ('JPY', 'Japanese Yen', '¥', 'ja-JP', true),
  ('CNY', 'Chinese Yuan', '¥', 'zh-CN', true),
  ('KRW', 'South Korean Won', '₩', 'ko-KR', true),
  ('INR', 'Indian Rupee', '₹', 'en-IN', true),
  ('BRL', 'Brazilian Real', 'R$', 'pt-BR', true),
  ('AUD', 'Australian Dollar', 'A$', 'en-AU', true),
  ('CAD', 'Canadian Dollar', 'C$', 'en-CA', true),
  ('CHF', 'Swiss Franc', 'Fr', 'de-CH', true),
  ('SEK', 'Swedish Krona', 'kr', 'sv-SE', true),
  ('NOK', 'Norwegian Krone', 'kr', 'nb-NO', true),
  ('PLN', 'Polish Zloty', 'zł', 'pl-PL', true),
  ('TRY', 'Turkish Lira', '₺', 'tr-TR', true),
  ('MXN', 'Mexican Peso', '$', 'es-MX', true),
  ('AED', 'UAE Dirham', 'د.إ', 'ar-AE', true),
  ('SGD', 'Singapore Dollar', 'S$', 'en-SG', true),
  ('HKD', 'Hong Kong Dollar', 'HK$', 'zh-HK', true)
ON CONFLICT (code) DO NOTHING;

-- Create index for faster exchange rate lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies 
  ON exchange_rates(from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched 
  ON exchange_rates(fetched_at DESC);

-- Create function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_latest_exchange_rate(
  p_from_currency text,
  p_to_currency text
)
RETURNS numeric AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;

  -- Get most recent rate
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
  ORDER BY fetched_at DESC
  LIMIT 1;

  -- If not found, try inverse rate
  IF v_rate IS NULL THEN
    SELECT 1.0 / rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_to_currency
      AND to_currency = p_from_currency
    ORDER BY fetched_at DESC
    LIMIT 1;
  END IF;

  RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;