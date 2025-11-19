-- Insert 40 test orders with various categories and skills
-- These orders are designed to test the recommendation system

INSERT INTO orders (user_id, title, description, category, price_min, price_max, currency, engagement, status, tags, created_at) VALUES
-- Unity/C# Game Development Orders
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'C# игра на Unity', 'Нужно сделать простую игру на Unity с использованием C#. Жанр - платформер 2D.', 'Разработка', 500, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['Unity', 'C#', 'игра', 'GameDev'], NOW() - INTERVAL '1 hour'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'Unity 3D шутер', 'Разработка 3D шутера на Unity. Требуется опыт в C# и работе с физикой.', 'Разработка', 2000, 5000, 'USD', 'Почасовка', 'open', ARRAY['Unity', 'C#', '3D', 'шутер', 'игра'], NOW() - INTERVAL '2 hours'),
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Мобильная игра Unity', 'Создание мобильной игры для Android/iOS на Unity. C# обязателен.', 'Разработка', 1000, 3000, 'USD', 'Фикс-прайс', 'open', ARRAY['Unity', 'C#', 'мобильная', 'Android', 'iOS'], NOW() - INTERVAL '3 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'VR проект Unity', 'Разработка VR приложения на Unity с использованием C#. Опыт с VR SDK.', 'Разработка', 3000, 7000, 'USD', 'Почасовка', 'open', ARRAY['Unity', 'C#', 'VR', 'игра'], NOW() - INTERVAL '4 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Игровая механика Unity', 'Доработка игровых механик в существующем Unity проекте. C# программирование.', 'Разработка', 800, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['Unity', 'C#', 'игра', 'механика'], NOW() - INTERVAL '5 hours'),

-- C++/Unreal Orders
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'Unreal Engine игра', 'Создание игры на Unreal Engine 5 с использованием C++.', 'Разработка', 4000, 8000, 'USD', 'Почасовка', 'open', ARRAY['Unreal', 'C++', 'игра'], NOW() - INTERVAL '6 hours'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'C++ оптимизация', 'Оптимизация C++ кода в игровом движке. Требуется опыт профилирования.', 'Разработка', 1500, 3500, 'USD', 'Фикс-прайс', 'open', ARRAY['C++', 'оптимизация', 'игра'], NOW() - INTERVAL '7 hours'),

-- Web Development Orders
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Веб-сайт на React', 'Разработка современного сайта на React. Требуется TypeScript.', 'Разработка', 1200, 3000, 'USD', 'Фикс-прайс', 'open', ARRAY['React', 'TypeScript', 'веб', 'сайт'], NOW() - INTERVAL '8 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Backend API Node.js', 'Создание RESTful API на Node.js. Нужен опыт с Express и базами данных.', 'Разработка', 1500, 4000, 'USD', 'Почасовка', 'open', ARRAY['Node.js', 'API', 'Backend'], NOW() - INTERVAL '9 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Лендинг страница', 'Разработка продающей лендинг страницы. HTML, CSS, JavaScript.', 'Разработка', 500, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['HTML', 'CSS', 'JavaScript', 'лендинг'], NOW() - INTERVAL '10 hours'),
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'Full-stack приложение', 'Создание full-stack веб-приложения. React + Node.js + PostgreSQL.', 'Разработка', 3000, 7000, 'USD', 'Почасовка', 'open', ARRAY['React', 'Node.js', 'Full-stack', 'PostgreSQL'], NOW() - INTERVAL '11 hours'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'E-commerce сайт', 'Разработка интернет-магазина с корзиной и оплатой.', 'Разработка', 2500, 6000, 'USD', 'Фикс-прайс', 'open', ARRAY['E-commerce', 'веб', 'сайт', 'магазин'], NOW() - INTERVAL '12 hours'),

-- Mobile Development Orders
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'iOS приложение Swift', 'Разработка нативного iOS приложения на Swift.', 'Разработка', 2000, 5000, 'USD', 'Фикс-прайс', 'open', ARRAY['iOS', 'Swift', 'мобильная'], NOW() - INTERVAL '13 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Android приложение Kotlin', 'Создание Android приложения на Kotlin. Material Design.', 'Разработка', 1800, 4500, 'USD', 'Почасовка', 'open', ARRAY['Android', 'Kotlin', 'мобильная'], NOW() - INTERVAL '14 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'React Native app', 'Кроссплатформенное мобильное приложение на React Native.', 'Разработка', 2200, 5500, 'USD', 'Фикс-прайс', 'open', ARRAY['React Native', 'мобильная', 'кроссплатформа'], NOW() - INTERVAL '15 hours'),
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'Flutter приложение', 'Разработка мобильного приложения на Flutter/Dart.', 'Разработка', 1900, 4800, 'USD', 'Почасовка', 'open', ARRAY['Flutter', 'Dart', 'мобильная'], NOW() - INTERVAL '16 hours'),

-- Design Orders
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'UI/UX дизайн приложения', 'Разработка дизайна мобильного приложения в Figma.', 'Дизайн', 800, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['Figma', 'UI', 'UX', 'дизайн'], NOW() - INTERVAL '17 hours'),
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Логотип и фирменный стиль', 'Создание логотипа и брендбука для стартапа.', 'Дизайн', 600, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['логотип', 'брендинг', 'дизайн'], NOW() - INTERVAL '18 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Дизайн сайта', 'Веб-дизайн корпоративного сайта. Figma или Adobe XD.', 'Дизайн', 1000, 2500, 'USD', 'Фикс-прайс', 'open', ARRAY['веб-дизайн', 'Figma', 'дизайн', 'сайт'], NOW() - INTERVAL '19 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', '3D моделирование', 'Создание 3D моделей для игры в Blender.', 'Дизайн', 1200, 3000, 'USD', 'Почасовка', 'open', ARRAY['3D', 'Blender', 'моделирование', 'игра'], NOW() - INTERVAL '20 hours'),

-- Marketing Orders
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'SMM продвижение', 'Продвижение в социальных сетях. Контент-план и посты.', 'Маркетинг', 500, 1200, 'USD', 'Почасовка', 'open', ARRAY['SMM', 'маркетинг', 'соцсети'], NOW() - INTERVAL '21 hours'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'SEO оптимизация', 'SEO продвижение сайта. Анализ конкурентов и стратегия.', 'Маркетинг', 800, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['SEO', 'маркетинг', 'продвижение'], NOW() - INTERVAL '22 hours'),
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Контекстная реклама', 'Настройка и ведение рекламы в Google Ads и Яндекс.Директ.', 'Маркетинг', 600, 1500, 'USD', 'Почасовка', 'open', ARRAY['реклама', 'Google Ads', 'маркетинг'], NOW() - INTERVAL '23 hours'),

-- Content/Writing Orders
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Копирайтинг статей', 'Написание SEO-статей для блога. Тематика IT.', 'Контент', 300, 800, 'USD', 'Фикс-прайс', 'open', ARRAY['копирайтинг', 'статьи', 'SEO'], NOW() - INTERVAL '24 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Техническая документация', 'Написание технической документации для API.', 'Контент', 500, 1200, 'USD', 'Фикс-прайс', 'open', ARRAY['документация', 'техническое', 'API'], NOW() - INTERVAL '25 hours'),

-- Video/Audio Orders
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'Монтаж видео', 'Монтаж рекламного ролика в Premiere Pro или DaVinci.', 'Видео', 600, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['видео', 'монтаж', 'Premiere'], NOW() - INTERVAL '26 hours'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'Анимация 2D', 'Создание 2D анимации для ролика. After Effects.', 'Видео', 800, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['анимация', '2D', 'After Effects'], NOW() - INTERVAL '27 hours'),

-- Data Science/AI Orders
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'ML модель Python', 'Разработка модели машинного обучения на Python.', 'Разработка', 2000, 5000, 'USD', 'Почасовка', 'open', ARRAY['Python', 'ML', 'AI', 'машинное обучение'], NOW() - INTERVAL '28 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Data Analysis', 'Анализ данных и визуализация в Jupyter Notebook.', 'Разработка', 1000, 2500, 'USD', 'Фикс-прайс', 'open', ARRAY['Python', 'анализ данных', 'Jupyter'], NOW() - INTERVAL '29 hours'),

-- DevOps/Infrastructure Orders
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Настройка CI/CD', 'Настройка непрерывной интеграции и деплоя. Docker, Kubernetes.', 'Разработка', 1500, 3500, 'USD', 'Фикс-прайс', 'open', ARRAY['DevOps', 'CI/CD', 'Docker', 'Kubernetes'], NOW() - INTERVAL '30 hours'),
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'AWS инфраструктура', 'Развертывание и настройка инфраструктуры в AWS.', 'Разработка', 2000, 4500, 'USD', 'Почасовка', 'open', ARRAY['AWS', 'DevOps', 'инфраструктура'], NOW() - INTERVAL '31 hours'),

-- More Game Development
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'Godot 2D игра', 'Разработка 2D игры на Godot Engine. GDScript.', 'Разработка', 1000, 2500, 'USD', 'Фикс-прайс', 'open', ARRAY['Godot', 'игра', '2D'], NOW() - INTERVAL '32 hours'),
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Игровой дизайн', 'Разработка геймдизайн документа и балансировка механик.', 'Дизайн', 800, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['game design', 'игра', 'геймдизайн'], NOW() - INTERVAL '33 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Игровая графика', 'Создание 2D спрайтов и анимации для игры.', 'Дизайн', 1000, 2500, 'USD', 'Фикс-прайс', 'open', ARRAY['2D', 'графика', 'игра', 'спрайты'], NOW() - INTERVAL '34 hours'),

-- More Programming
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Java приложение', 'Разработка desktop приложения на Java. Swing или JavaFX.', 'Разработка', 1500, 3500, 'USD', 'Почасовка', 'open', ARRAY['Java', 'desktop', 'программирование'], NOW() - INTERVAL '35 hours'),
('018f8b1f-5a80-4c7c-ab50-d7a7e25405ec', 'C# WPF приложение', 'Создание Windows приложения на C# WPF.', 'Разработка', 1800, 4000, 'USD', 'Фикс-прайс', 'open', ARRAY['C#', 'WPF', 'Windows'], NOW() - INTERVAL '36 hours'),
('1336ec28-e307-4e0a-a603-830321b4c5e6', 'Python скрипты', 'Написание Python скриптов для автоматизации задач.', 'Разработка', 500, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['Python', 'скрипты', 'автоматизация'], NOW() - INTERVAL '37 hours'),
('20198b5b-bfa4-4a9e-9047-3da50370025d', 'Telegram бот', 'Разработка Telegram бота на Python. aiogram или python-telegram-bot.', 'Разработка', 600, 1800, 'USD', 'Фикс-прайс', 'open', ARRAY['Python', 'Telegram', 'бот'], NOW() - INTERVAL '38 hours'),
('2a4c5c3d-7b7c-41e2-81c9-9adec7504318', 'Discord бот', 'Создание Discord бота с кастомными командами.', 'Разработка', 500, 1500, 'USD', 'Фикс-прайс', 'open', ARRAY['Discord', 'бот', 'программирование'], NOW() - INTERVAL '39 hours'),
('31f68c5a-2e59-4a04-9afe-bc510b4d3d4d', 'Веб-парсер Python', 'Разработка парсера сайтов на Python. BeautifulSoup или Scrapy.', 'Разработка', 700, 2000, 'USD', 'Фикс-прайс', 'open', ARRAY['Python', 'парсинг', 'веб-скрейпинг'], NOW() - INTERVAL '40 hours');
