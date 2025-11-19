/*
  # Update Categories and Subcategories

  1. Changes
    - Clear existing categories and subcategories
    - Insert new categories matching CategoriesPage
    - Insert corresponding subcategories for each category
*/

-- Clear existing data
TRUNCATE TABLE subcategories CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Insert categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Разработка', 'development', 'Code', 'Создание сайтов, приложений, игр и программного обеспечения любой сложности'),
  ('Дизайн', 'design', 'Brush', 'Графический дизайн, брендинг, создание логотипов и визуального контента'),
  ('Маркетинг', 'marketing', 'Megaphone', 'Продвижение бизнеса, настройка рекламы и аналитика эффективности'),
  ('Тексты и переводы', 'texts-and-translations', 'FileText', 'Создание качественных текстов, переводы и редактирование контента'),
  ('Видео и Аудио', 'video-and-audio', 'Video', 'Монтаж видео, создание музыки, озвучка и звуковой дизайн'),
  ('Бизнес', 'business', 'Briefcase', 'Консультации, финансовый анализ и бизнес-планирование'),
  ('Соцсети', 'social', 'Share2', 'Ведение аккаунтов, создание контента и стратегии продвижения'),
  ('IT-поддержка', 'it-support', 'Server', 'Настройка серверов, хостинг и техническая поддержка'),
  ('Образование и репетиторство', 'education', 'GraduationCap', 'Онлайн обучение, репетиторство и помощь с учебными задачами'),
  ('Жизненные задачи (Lifestyle)', 'lifestyle', 'Heart', 'Персональные консультации и помощь в повседневных задачах'),
  ('eCommerce', 'ecommerce', 'ShoppingCart', 'Создание и продвижение интернет-магазинов'),
  ('NFT / Web3', 'nft-web3', 'Coins', 'Блокчейн технологии, NFT и криптовалюты'),
  ('Архитектура', 'architecture', 'Building', 'Проектирование зданий и 3D визуализация объектов'),
  ('Инженерия', 'engineering', 'Cog', 'Прототипирование, электроника и IoT решения'),
  ('HR и управление', 'hr', 'Users', 'Подбор персонала, карьерные консультации и HR услуги');

-- Insert subcategories for each category
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Разработка
  SELECT id INTO cat_id FROM categories WHERE slug = 'development';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Веб-разработка', 'web-dev', 'Создание веб-сайтов и веб-приложений'),
    (cat_id, 'Мобильная разработка', 'mobile-dev', 'Разработка iOS и Android приложений'),
    (cat_id, 'GameDev', 'gamedev', 'Создание компьютерных игр'),
    (cat_id, 'Backend', 'backend', 'Серверная разработка и API'),
    (cat_id, 'Full-stack', 'fullstack', 'Полный цикл разработки'),
    (cat_id, 'AI/ML', 'ai-ml', 'Машинное обучение и ИИ'),
    (cat_id, 'ChatGPT/AI-боты', 'ai-bots', 'Разработка AI-ботов и чат-ботов'),
    (cat_id, 'Десктоп-ПО', 'desktop', 'Десктопные приложения'),
    (cat_id, 'DevOps', 'devops', 'DevOps и инфраструктура'),
    (cat_id, 'Скрипты/автоматизации', 'automation', 'Автоматизация процессов');

  -- Дизайн
  SELECT id INTO cat_id FROM categories WHERE slug = 'design';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Лого', 'logo', 'Разработка логотипов'),
    (cat_id, 'UX/UI', 'ux-ui', 'UX/UI дизайн интерфейсов'),
    (cat_id, 'Баннеры', 'banners', 'Создание баннеров и рекламы'),
    (cat_id, 'Веб-дизайн', 'web-design', 'Дизайн веб-сайтов'),
    (cat_id, '3D', '3d', '3D-моделирование и дизайн'),
    (cat_id, 'Иллюстрации', 'illustrations', 'Создание иллюстраций'),
    (cat_id, 'Motion (анимация)', 'motion', 'Motion-дизайн и анимация'),
    (cat_id, 'Презентации', 'presentations', 'Дизайн презентаций'),
    (cat_id, 'Фирменный стиль', 'branding', 'Разработка фирменного стиля');

  -- Маркетинг
  SELECT id INTO cat_id FROM categories WHERE slug = 'marketing';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Таргет', 'targeting', 'Таргетированная реклама'),
    (cat_id, 'SEO', 'seo', 'Поисковая оптимизация'),
    (cat_id, 'Контекстная реклама', 'context-ads', 'Контекстная реклама'),
    (cat_id, 'Email маркетинг', 'email-marketing', 'Email маркетинг'),
    (cat_id, 'Продвижение соцсетей', 'smm', 'SMM продвижение'),
    (cat_id, 'Аналитика/веб-аналитика', 'analytics', 'Аналитика и метрики');

  -- Тексты и переводы
  SELECT id INTO cat_id FROM categories WHERE slug = 'texts-and-translations';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Копирайт', 'copywriting', 'Копирайтинг'),
    (cat_id, 'Рерайт', 'rewriting', 'Рерайтинг текстов'),
    (cat_id, 'Переводы', 'translation', 'Перевод текстов'),
    (cat_id, 'Редактура', 'editing', 'Редактура и корректура'),
    (cat_id, 'Технические тексты', 'technical-writing', 'Технические тексты'),
    (cat_id, 'Сценарии', 'scripts', 'Написание сценариев'),
    (cat_id, 'Описания товаров', 'product-descriptions', 'Описания товаров');

  -- Видео и Аудио
  SELECT id INTO cat_id FROM categories WHERE slug = 'video-and-audio';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Монтаж', 'video-editing', 'Монтаж видео'),
    (cat_id, 'Озвучка', 'voiceover', 'Озвучка'),
    (cat_id, 'Музыка', 'music', 'Создание музыки'),
    (cat_id, 'VFX', 'vfx', 'VFX эффекты'),
    (cat_id, 'Саунд-дизайн', 'sound-design', 'Звуковой дизайн'),
    (cat_id, 'Colour grading', 'colour-grading', 'Цветокоррекция');

  -- Бизнес
  SELECT id INTO cat_id FROM categories WHERE slug = 'business';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Создание презентаций', 'business-presentations', 'Создание бизнес-презентаций'),
    (cat_id, 'Консультации', 'consulting', 'Бизнес-консультации'),
    (cat_id, 'Финансовая аналитика', 'financial-analytics', 'Финансовая аналитика'),
    (cat_id, 'Бизнес-планы', 'business-plans', 'Разработка бизнес-планов'),
    (cat_id, 'Маркетплейсы', 'marketplaces', 'Работа с маркетплейсами'),
    (cat_id, 'CRM сопровождение', 'crm-support', 'CRM сопровождение');

  -- Соцсети
  SELECT id INTO cat_id FROM categories WHERE slug = 'social';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Ведение Instagram/TikTok', 'social-management', 'Ведение соцсетей'),
    (cat_id, 'Монтаж Reels', 'reels-editing', 'Монтаж Reels'),
    (cat_id, 'Стратегии контента', 'content-strategy', 'Стратегии контента'),
    (cat_id, 'Создание постов', 'post-creation', 'Создание постов'),
    (cat_id, 'Оформление профиля', 'profile-design', 'Дизайн профиля');

  -- IT-поддержка
  SELECT id INTO cat_id FROM categories WHERE slug = 'it-support';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Настройка серверов', 'server-setup', 'Настройка серверов'),
    (cat_id, 'Хостинг', 'hosting', 'Хостинг'),
    (cat_id, 'Поддержка сайтов', 'website-support', 'Поддержка сайтов'),
    (cat_id, 'Настройка сетей', 'network-setup', 'Настройка сетей'),
    (cat_id, 'Установка CMS', 'cms-installation', 'Установка CMS'),
    (cat_id, 'Решение техпроблем', 'tech-support', 'Решение техпроблем');

  -- Образование и репетиторство
  SELECT id INTO cat_id FROM categories WHERE slug = 'education';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Репетиторы', 'tutors', 'Репетиторство'),
    (cat_id, 'Курсы', 'courses', 'Онлайн-курсы'),
    (cat_id, 'Домашние задания', 'homework-help', 'Помощь с домашними заданиями'),
    (cat_id, 'Подготовка к экзаменам', 'exam-prep', 'Подготовка к экзаменам');

  -- Жизненные задачи
  SELECT id INTO cat_id FROM categories WHERE slug = 'lifestyle';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Личные советы', 'personal-advice', 'Личные советы'),
    (cat_id, 'Фото-обработка', 'photo-editing', 'Обработка фото'),
    (cat_id, 'Помощь с документами', 'document-help', 'Помощь с документами'),
    (cat_id, 'Тестирование продуктов', 'product-testing', 'Тестирование продуктов'),
    (cat_id, 'Психология/консультирование', 'psychology', 'Психологическое консультирование'),
    (cat_id, 'Виртуальные ассистенты', 'virtual-assistants', 'Виртуальные ассистенты');

  -- eCommerce
  SELECT id INTO cat_id FROM categories WHERE slug = 'ecommerce';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Shopify', 'shopify', 'Shopify разработка'),
    (cat_id, 'WooCommerce', 'woocommerce', 'WooCommerce разработка'),
    (cat_id, 'Продвижение товаров', 'product-promotion', 'Продвижение товаров'),
    (cat_id, 'Маркетплейс-лендинги', 'marketplace-landings', 'Лендинги для маркетплейсов');

  -- NFT / Web3
  SELECT id INTO cat_id FROM categories WHERE slug = 'nft-web3';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'NFT-арт', 'nft-art', 'NFT-арт'),
    (cat_id, 'Смарт-контракты', 'smart-contracts', 'Смарт-контракты'),
    (cat_id, 'Токен-экономика', 'tokenomics', 'Токен-экономика');

  -- Архитектура
  SELECT id INTO cat_id FROM categories WHERE slug = 'architecture';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Чертежи', 'blueprints', 'Чертежи'),
    (cat_id, '3D-макеты', '3d-models', '3D-макеты зданий'),
    (cat_id, 'Архвизуализация', 'archviz', 'Архитектурная визуализация');

  -- Инженерия
  SELECT id INTO cat_id FROM categories WHERE slug = 'engineering';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Прототипирование', 'prototyping', 'Прототипирование'),
    (cat_id, 'Электроника', 'electronics', 'Электроника'),
    (cat_id, 'Arduino/IoT', 'arduino-iot', 'Arduino и IoT');

  -- HR и управление
  SELECT id INTO cat_id FROM categories WHERE slug = 'hr';
  INSERT INTO subcategories (category_id, name, slug, description) VALUES
    (cat_id, 'Найм персонала', 'recruitment', 'Подбор персонала'),
    (cat_id, 'Создание резюме', 'resume-writing', 'Создание резюме'),
    (cat_id, 'Карьерные консультации', 'career-consulting', 'Карьерное консультирование');
END $$;
