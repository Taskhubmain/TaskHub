/*
  # Create Categories and Subcategories System

  ## Overview
  Creates a comprehensive category and subcategory system for orders and tasks.

  ## New Tables
  1. `categories`
    - `id` (uuid, primary key)
    - `name` (text) - Category name
    - `slug` (text, unique) - URL-friendly identifier
    - `icon` (text) - Lucide icon name
    - `description` (text, optional)
    - `created_at` (timestamptz)

  2. `subcategories`
    - `id` (uuid, primary key)
    - `category_id` (uuid, foreign key) - Parent category
    - `name` (text) - Subcategory name
    - `slug` (text) - URL-friendly identifier
    - `description` (text, optional)
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Public read access
  - Admin-only write access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'Folder',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
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

-- Policies for subcategories
CREATE POLICY "Anyone can view subcategories"
  ON subcategories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subcategories"
  ON subcategories FOR ALL
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Insert categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Дизайн', 'design', 'Palette', 'Графический дизайн, UI/UX, брендинг'),
  ('Программирование', 'programming', 'Code', 'Разработка ПО, веб-разработка, мобильные приложения'),
  ('Маркетинг', 'marketing', 'TrendingUp', 'SEO, SMM, контент-маркетинг, реклама'),
  ('Копирайтинг', 'copywriting', 'FileText', 'Написание текстов, статей, сценариев'),
  ('Переводы', 'translation', 'Languages', 'Перевод текстов на различные языки'),
  ('Видео', 'video', 'Video', 'Видеомонтаж, анимация, производство видео'),
  ('Аудио', 'audio', 'Mic', 'Озвучка, музыка, аудиомонтаж, подкасты'),
  ('Консультации', 'consulting', 'MessageCircle', 'Бизнес-консультирование, экспертиза'),
  ('Образование', 'education', 'GraduationCap', 'Обучение, репетиторство, курсы'),
  ('Фото', 'photo', 'Camera', 'Фотография, ретушь, обработка'),
  ('3D и Анимация', '3d-animation', 'Box', '3D-моделирование, анимация, визуализация'),
  ('Архитектура', 'architecture', 'Building', 'Архитектурное проектирование, дизайн интерьеров')
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories for Design
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Логотипы и брендинг', 'logos-branding', 'Создание логотипов, фирменного стиля'
FROM categories WHERE slug = 'design'
UNION ALL
SELECT id, 'UI/UX дизайн', 'ui-ux', 'Дизайн интерфейсов и пользовательского опыта'
FROM categories WHERE slug = 'design'
UNION ALL
SELECT id, 'Веб-дизайн', 'web-design', 'Дизайн сайтов и лендингов'
FROM categories WHERE slug = 'design'
UNION ALL
SELECT id, 'Мобильный дизайн', 'mobile-design', 'Дизайн мобильных приложений'
FROM categories WHERE slug = 'design'
UNION ALL
SELECT id, 'Иллюстрация', 'illustration', 'Цифровая и традиционная иллюстрация'
FROM categories WHERE slug = 'design'
UNION ALL
SELECT id, 'Полиграфия', 'print-design', 'Дизайн для печати: визитки, флаеры, буклеты'
FROM categories WHERE slug = 'design';

-- Insert subcategories for Programming
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Веб-разработка', 'web-development', 'Frontend, Backend, Full-stack'
FROM categories WHERE slug = 'programming'
UNION ALL
SELECT id, 'Мобильная разработка', 'mobile-development', 'iOS, Android, React Native, Flutter'
FROM categories WHERE slug = 'programming'
UNION ALL
SELECT id, 'Desktop приложения', 'desktop-apps', 'Разработка приложений для ПК'
FROM categories WHERE slug = 'programming'
UNION ALL
SELECT id, 'Базы данных', 'databases', 'Проектирование и оптимизация БД'
FROM categories WHERE slug = 'programming'
UNION ALL
SELECT id, 'DevOps', 'devops', 'CI/CD, Docker, Kubernetes, облачные технологии'
FROM categories WHERE slug = 'programming'
UNION ALL
SELECT id, 'Боты и автоматизация', 'bots-automation', 'Telegram боты, парсеры, скрипты'
FROM categories WHERE slug = 'programming';

-- Insert subcategories for Marketing
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'SEO', 'seo', 'Поисковая оптимизация сайтов'
FROM categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'SMM', 'smm', 'Продвижение в социальных сетях'
FROM categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Контекстная реклама', 'contextual-ads', 'Google Ads, Яндекс.Директ'
FROM categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Email-маркетинг', 'email-marketing', 'Рассылки, автоворонки'
FROM categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Контент-маркетинг', 'content-marketing', 'Стратегия и создание контента'
FROM categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Аналитика', 'analytics', 'Веб-аналитика, метрики, отчеты'
FROM categories WHERE slug = 'marketing';

-- Insert subcategories for Copywriting
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Статьи и блоги', 'articles-blogs', 'Написание статей для сайтов и блогов'
FROM categories WHERE slug = 'copywriting'
UNION ALL
SELECT id, 'Коммерческие тексты', 'sales-copy', 'Продающие тексты, описания товаров'
FROM categories WHERE slug = 'copywriting'
UNION ALL
SELECT id, 'Сценарии', 'scripts', 'Сценарии для видео, подкастов, презентаций'
FROM categories WHERE slug = 'copywriting'
UNION ALL
SELECT id, 'Редактура и корректура', 'editing-proofreading', 'Редактирование и проверка текстов'
FROM categories WHERE slug = 'copywriting'
UNION ALL
SELECT id, 'Технические тексты', 'technical-writing', 'Документация, инструкции, мануалы'
FROM categories WHERE slug = 'copywriting';

-- Insert subcategories for Translation
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Художественный перевод', 'literary-translation', 'Перевод книг, рассказов, поэзии'
FROM categories WHERE slug = 'translation'
UNION ALL
SELECT id, 'Технический перевод', 'technical-translation', 'Перевод технической документации'
FROM categories WHERE slug = 'translation'
UNION ALL
SELECT id, 'Деловой перевод', 'business-translation', 'Перевод деловых документов'
FROM categories WHERE slug = 'translation'
UNION ALL
SELECT id, 'Локализация', 'localization', 'Адаптация контента для других рынков'
FROM categories WHERE slug = 'translation'
UNION ALL
SELECT id, 'Субтитры', 'subtitles', 'Создание и перевод субтитров'
FROM categories WHERE slug = 'translation';

-- Insert subcategories for Video
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Монтаж видео', 'video-editing', 'Обработка и монтаж видеороликов'
FROM categories WHERE slug = 'video'
UNION ALL
SELECT id, '2D анимация', '2d-animation', 'Создание 2D анимации и motion-графики'
FROM categories WHERE slug = 'video'
UNION ALL
SELECT id, 'Видеосъемка', 'videography', 'Съемка видео для различных целей'
FROM categories WHERE slug = 'video'
UNION ALL
SELECT id, 'Цветокоррекция', 'color-grading', 'Цветокоррекция и грейдинг видео'
FROM categories WHERE slug = 'video'
UNION ALL
SELECT id, 'Explainer видео', 'explainer-videos', 'Создание обучающих и презентационных роликов'
FROM categories WHERE slug = 'video';

-- Insert subcategories for Audio
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Озвучка', 'voice-over', 'Голосовая озвучка для видео, аудиокниг'
FROM categories WHERE slug = 'audio'
UNION ALL
SELECT id, 'Музыка', 'music', 'Создание музыки, саундтреков'
FROM categories WHERE slug = 'audio'
UNION ALL
SELECT id, 'Аудиомонтаж', 'audio-editing', 'Обработка и монтаж аудио'
FROM categories WHERE slug = 'audio'
UNION ALL
SELECT id, 'Подкасты', 'podcasts', 'Создание и продюсирование подкастов'
FROM categories WHERE slug = 'audio'
UNION ALL
SELECT id, 'Звуковые эффекты', 'sound-effects', 'Создание звуковых эффектов'
FROM categories WHERE slug = 'audio';

-- Insert subcategories for Consulting
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Бизнес-консультации', 'business-consulting', 'Стратегия, развитие бизнеса'
FROM categories WHERE slug = 'consulting'
UNION ALL
SELECT id, 'Финансовые консультации', 'financial-consulting', 'Финансовое планирование, инвестиции'
FROM categories WHERE slug = 'consulting'
UNION ALL
SELECT id, 'IT-консультации', 'it-consulting', 'Консультации по IT и технологиям'
FROM categories WHERE slug = 'consulting'
UNION ALL
SELECT id, 'HR-консультации', 'hr-consulting', 'Подбор персонала, HR-процессы'
FROM categories WHERE slug = 'consulting'
UNION ALL
SELECT id, 'Юридические консультации', 'legal-consulting', 'Правовые консультации'
FROM categories WHERE slug = 'consulting';

-- Insert subcategories for Education
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Репетиторство', 'tutoring', 'Индивидуальные занятия по предметам'
FROM categories WHERE slug = 'education'
UNION ALL
SELECT id, 'Онлайн-курсы', 'online-courses', 'Создание и проведение онлайн-курсов'
FROM categories WHERE slug = 'education'
UNION ALL
SELECT id, 'Языки', 'languages', 'Обучение иностранным языкам'
FROM categories WHERE slug = 'education'
UNION ALL
SELECT id, 'IT-обучение', 'it-training', 'Обучение программированию и технологиям'
FROM categories WHERE slug = 'education'
UNION ALL
SELECT id, 'Бизнес-обучение', 'business-training', 'Тренинги по бизнесу и менеджменту'
FROM categories WHERE slug = 'education';

-- Insert subcategories for Photo
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Портретная съемка', 'portrait-photography', 'Фотосъемка портретов'
FROM categories WHERE slug = 'photo'
UNION ALL
SELECT id, 'Предметная съемка', 'product-photography', 'Фотосъемка товаров'
FROM categories WHERE slug = 'photo'
UNION ALL
SELECT id, 'Ретушь', 'retouching', 'Профессиональная ретушь фотографий'
FROM categories WHERE slug = 'photo'
UNION ALL
SELECT id, 'Событийная съемка', 'event-photography', 'Фотосъемка мероприятий'
FROM categories WHERE slug = 'photo'
UNION ALL
SELECT id, 'Обработка фото', 'photo-editing', 'Редактирование и улучшение фотографий'
FROM categories WHERE slug = 'photo';

-- Insert subcategories for 3D Animation
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, '3D-моделирование', '3d-modeling', 'Создание 3D моделей'
FROM categories WHERE slug = '3d-animation'
UNION ALL
SELECT id, '3D-анимация', '3d-animation-work', 'Анимация 3D персонажей и объектов'
FROM categories WHERE slug = '3d-animation'
UNION ALL
SELECT id, 'Визуализация', 'visualization', '3D визуализация архитектуры и интерьеров'
FROM categories WHERE slug = '3d-animation'
UNION ALL
SELECT id, 'Рендеринг', 'rendering', 'Рендеринг 3D сцен'
FROM categories WHERE slug = '3d-animation'
UNION ALL
SELECT id, 'Game Art', 'game-art', '3D для игр: модели, текстуры'
FROM categories WHERE slug = '3d-animation';

-- Insert subcategories for Architecture
INSERT INTO subcategories (category_id, name, slug, description)
SELECT id, 'Архитектурное проектирование', 'architectural-design', 'Проектирование зданий и сооружений'
FROM categories WHERE slug = 'architecture'
UNION ALL
SELECT id, 'Дизайн интерьеров', 'interior-design', 'Проектирование интерьеров'
FROM categories WHERE slug = 'architecture'
UNION ALL
SELECT id, 'Ландшафтный дизайн', 'landscape-design', 'Проектирование ландшафтов'
FROM categories WHERE slug = 'architecture'
UNION ALL
SELECT id, 'BIM проектирование', 'bim-design', 'Building Information Modeling'
FROM categories WHERE slug = 'architecture'
UNION ALL
SELECT id, 'Чертежи и планы', 'drawings-plans', 'Создание технических чертежей'
FROM categories WHERE slug = 'architecture';
