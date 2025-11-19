/*
  # Create Categories Table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `slug` (text, unique) - URL-friendly identifier
      - `description` (text, optional) - Category description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `categories` table
    - Add policies for admin management and public read access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view categories
CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert categories
CREATE POLICY "Admins can create categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Policy: Only admins can update categories
CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Policy: Only admins can delete categories
CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Insert some default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Дизайн', 'design', 'Графический дизайн, UI/UX, брендинг'),
  ('Программирование', 'programming', 'Разработка ПО, веб-разработка'),
  ('Маркетинг', 'marketing', 'SEO, SMM, контент-маркетинг'),
  ('Копирайтинг', 'copywriting', 'Написание текстов и статей'),
  ('Переводы', 'translation', 'Перевод текстов на различные языки'),
  ('Видео', 'video', 'Видеомонтаж, анимация, производство видео'),
  ('Аудио', 'audio', 'Озвучка, музыка, аудиомонтаж'),
  ('Консультации', 'consulting', 'Бизнес-консультирование, экспертиза')
ON CONFLICT (slug) DO NOTHING;
