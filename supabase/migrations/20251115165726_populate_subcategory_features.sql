/*
  # Populate subcategory features

  ## Overview
  Inserts feature parameters for all subcategories (10 parameters each)
*/

-- Веб-разработка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Адаптивная верстка',
  'Десктоп + мобильная версия',
  'SEO-структура',
  'Интерактивные элементы',
  'Интеграции API',
  'CMS (WordPress/Webflow)',
  'Формы/заявки',
  'Оптимизация скорости',
  'Поддержка браузеров',
  'Админ-панель'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'web-development';

-- Мобильная разработка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'iOS приложение',
  'Android приложение',
  'Авторизация (OAuth/Email)',
  'Push-уведомления',
  'UI/UX макет',
  'Интеграция API',
  'Локальное хранение данных',
  'Публикация в сторы',
  'Тестирование',
  'Чат/мессенджер'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'mobile-development';

-- Desktop приложения
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Windows',
  'MacOS',
  'Установка',
  'Встроенная БД',
  'Оффлайн-режим',
  'Синхронизация',
  'UI',
  'Горячие клавиши',
  'Обновления',
  'Логи/ошибки'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'desktop-apps';

-- Базы данных
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Проектирование схемы',
  'SQL запросы',
  'Индексация',
  'Оптимизация',
  'Миграции',
  'Бэкапы',
  'Репликация',
  'Документация',
  'Безопасность',
  'Мониторинг'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'databases';

-- DevOps
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Docker',
  'CI/CD',
  'Deploy на VPS',
  'Сервера Linux',
  'Мониторинг',
  'SSL/HTTPS',
  'Оптимизация',
  'Бэкапы',
  'Логи',
  'Безопасность'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'devops';

-- Боты и автоматизация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Python',
  'JS',
  'Парсинг',
  'Cron-задачи',
  'API-интеграции',
  'Excel/CSV автогенерация',
  'Автоматика почты',
  'Telegram-боты',
  'Макросы',
  'Обработка БД'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'bots-automation';

-- Логотипы и брендинг
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Минимализм',
  'Цветные варианты',
  'Ч/Б версия',
  'Вектор',
  'Маскот',
  'Типографика',
  'Фирменный символ',
  'Вертикальная версия',
  'Горизонтальная версия',
  'Гайдлайн'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'logos-branding';

-- UI/UX дизайн
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Мобильный UI',
  'Desktop UI',
  'Wireframes',
  'High-fidelity прототип',
  'Дизайн-система',
  'Иконки',
  'UX-аналитика',
  'Юзабилити правки',
  'Компоненты',
  'Анимации'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'ui-ux';

-- Веб-дизайн
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Лендинг',
  'Многостраничник',
  'UI-компоненты',
  'Иконки',
  'Иллюстрации',
  'Дизайн-система',
  'Адаптивы',
  'UX-правки',
  'Прототип',
  'Брендинг'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'web-design';

-- Мобильный дизайн
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'iOS дизайн',
  'Android дизайн',
  'Адаптивы',
  'Иконки',
  'Wireframes',
  'Прототип',
  'UI-kit',
  'Анимации',
  'Онбординг',
  'App Store скриншоты'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'mobile-design';

-- Иллюстрация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Стиль',
  'Цвет',
  'BW',
  'Фоны',
  'Персонажи',
  'Объекты',
  'Лайн-арт',
  'Печать',
  'Вектор',
  'Сцены'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'illustration';

-- Полиграфия
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Визитки',
  'Флаеры',
  'Буклеты',
  'Брошюры',
  'Баннеры',
  'Листовки',
  'Плакаты',
  'Каталоги',
  'Упаковка',
  'Подготовка к печати'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'print-design';

-- SEO
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Семантика',
  'Техаудит',
  'Тексты',
  'Метатеги',
  'Скорость',
  'Структура',
  'Внутренняя оптимизация',
  'Внешняя оптимизация',
  'Sitemap/robots',
  'Аналитика'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'seo';

-- SMM
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Контент-план',
  'Посты',
  'Reels',
  'Stories',
  'Публикации',
  'Аналитика',
  'Оформление',
  'Копирайтинг',
  'Шаблоны',
  'Монтаж'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'smm';

-- Контекстная реклама
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Google Ads',
  'Яндекс',
  'Поисковые кампании',
  'Медийная реклама',
  'Ретаргет',
  'A/B',
  'Сегментация',
  'KPI',
  'Отчётность',
  'Аналитика'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'contextual-ads';

-- Email-маркетинг
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Шаблон',
  'HTML-верстка',
  'Автоворонки',
  'Триггеры',
  'База',
  'A/B',
  'Визуал',
  'Спам-чекап',
  'Тесты',
  'Аналитика'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'email-marketing';

-- Контент-маркетинг
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Контент-план',
  'Стратегия',
  'Статьи',
  'Блоги',
  'Соцсети',
  'SEO',
  'Визуал',
  'Календарь',
  'Аналитика',
  'Отчеты'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'content-marketing';

-- Аналитика
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'GA4',
  'Метрика',
  'Дашборды',
  'KPIs',
  'Теги',
  'Воронки',
  'A/B тесты',
  'Скорость',
  'Сегменты',
  'Конверсии'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'analytics';

-- Статьи и блоги
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'SEO',
  'Тональность',
  'ЦА',
  'Объём',
  'УТП',
  'Стиль',
  'Заголовки',
  'Структура',
  'Рерайт',
  'Лонгрид'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'articles-blogs';

-- Коммерческие тексты
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Продающие тексты',
  'Описания товаров',
  'Лендинг',
  'УТП',
  'CTA',
  'SEO',
  'Структура',
  'Заголовки',
  'Преимущества',
  'Триггеры'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'sales-copy';

-- Сценарии
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Хронометраж',
  'Стиль',
  'Жанр',
  'Сюжет',
  'Voiceover',
  'Герои',
  'Диалоги',
  'Синопсис',
  'Анимация',
  'Текст ролика'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'scripts';

-- Редактура и корректура
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Орфография',
  'Стиль',
  'Факты',
  'Логика',
  'Тональность',
  'Лексика',
  'Суть',
  'SEO',
  'Переписывание',
  'Проверка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'editing-proofreading';

-- Технические тексты
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Инструкция',
  'Документация',
  'ТЗ',
  'Статья',
  'Глоссарий',
  'Схемы',
  'Формулы',
  'Таблицы',
  'Рисунки',
  'Примеры'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'technical-writing';

-- Художественный перевод
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Языковая пара',
  'Литературный стиль',
  'Адаптация',
  'Редактура',
  'Корректура',
  'Форматирование',
  'Сноски',
  'Глоссарий',
  'Консультация автора',
  'Финальная вычитка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'literary-translation';

-- Технический перевод
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Языковая пара',
  'Терминология',
  'Стиль',
  'Формат',
  'Адаптация',
  'Глоссарий',
  'Скорость',
  'Проверка',
  'Локализация',
  'CAT-инструменты'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'technical-translation';

-- Деловой перевод
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Языковая пара',
  'Контракты',
  'Письма',
  'Отчеты',
  'Презентации',
  'Нотариальное заверение',
  'Конфиденциальность',
  'Срочность',
  'Форматирование',
  'Финальная проверка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'business-translation';

-- Локализация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Языковая пара',
  'Адаптация контента',
  'Культурные особенности',
  'UI/UX',
  'Тестирование',
  'Глоссарий',
  'Форматы',
  'QA',
  'Интеграция',
  'Финальная проверка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'localization';

-- Субтитры
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Языковая пара',
  'Тайминг',
  'Синхронизация',
  'Форматы (SRT/VTT)',
  'Редактура',
  'Адаптация',
  'Цензура',
  'Проверка',
  'Стилизация',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'subtitles';

-- Монтаж видео
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Хронометраж',
  'Вертикалка/горизонт',
  'Субтитры',
  'Переходы',
  'Ритм',
  'Цветокор',
  'Мультикамерность',
  'Анимация текста',
  'Чистка звука',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'video-editing';

-- 2D анимация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Персонажи',
  'Motion графика',
  'Переходы',
  'Лого-анимация',
  'Инфографика',
  'Текстовая анимация',
  'Эффекты',
  'Синхронизация',
  'Музыка',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = '2d-animation';

-- Видеосъемка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Локация',
  'Оборудование',
  'Свет',
  'Звук',
  'Режиссура',
  'Операторская работа',
  'Хронометраж',
  'Исходники',
  'Монтаж',
  'Цветокоррекция'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'videography';

-- Цветокоррекция
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'LUT',
  'Стиль',
  'Температура',
  'Контраст',
  'Skin-tone',
  'Shadows/highlights',
  'Film-look',
  'Cinematic',
  'HDR',
  'Final pass'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'color-grading';

-- Explainer видео
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Сценарий',
  'Анимация',
  'Персонажи',
  'Инфографика',
  'Озвучка',
  'Музыка',
  'Субтитры',
  'Брендинг',
  'Хронометраж',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'explainer-videos';

-- Озвучка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Пол',
  'Возраст',
  'Эмоции',
  'Чистка',
  'Шумоподавление',
  'Скорость',
  'Тон',
  'Акценты',
  'Интонация',
  'Драматизация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'voice-over';

-- Музыка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Жанр',
  'BPM',
  'Аранжировка',
  'Инструменты',
  'Мастеринг',
  'Микс',
  'Вокал',
  'Длина',
  'Лейеры',
  'Референсы'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'music';

-- Аудиомонтаж
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Чистка звука',
  'Шумоподавление',
  'Эквализация',
  'Компрессия',
  'Склейка',
  'Нормализация',
  'Эффекты',
  'Фейды',
  'Мастеринг',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'audio-editing';

-- Подкасты
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Запись',
  'Чистка',
  'Монтаж',
  'Интро/аутро',
  'Музыка',
  'Эффекты',
  'Мастеринг',
  'Обложка',
  'Метаданные',
  'Публикация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'podcasts';

-- Звуковые эффекты
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Эффекты',
  'Атмосферы',
  'Фоле',
  'Синты',
  'Клики/риски',
  'Звуковая сцена',
  'Лупы',
  'Микс',
  'Финал',
  'Clean-up'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'sound-effects';

-- Бизнес-консультации
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Тема',
  'Время',
  'Формат',
  'Разбор проблемы',
  'Стратегия',
  'Звонок/чат',
  'Материалы',
  'Чеклист',
  'Аналитика',
  'Рекомендации'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'business-consulting';

-- Финансовые консультации
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Отчеты',
  'Модели',
  'Прогнозы',
  'Маржа',
  'Рентабельность',
  'Анализ рисков',
  'Таблицы',
  'Графики',
  'Выводы',
  'Оптимизация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'financial-consulting';

-- IT-консультации
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Архитектура',
  'Стек технологий',
  'Code review',
  'Оптимизация',
  'Безопасность',
  'Масштабируемость',
  'DevOps',
  'Документация',
  'Обучение команды',
  'Рекомендации'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'it-consulting';

-- HR-консультации
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Поиск',
  'Скрининг',
  'Интервью',
  'Тестовое',
  'Оценка',
  'Рекомендации',
  'Онбординг',
  'Профиль',
  'Soft skills',
  'Отчёт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'hr-consulting';

-- Юридические консультации
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Консультация',
  'Анализ документов',
  'Договоры',
  'Регистрация',
  'Лицензии',
  'Претензии',
  'Споры',
  'Защита прав',
  'Рекомендации',
  'Сопровождение'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'legal-consulting';

-- Репетиторство
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Предмет',
  'Уровень',
  'Формат',
  'Время',
  'Домашка',
  'Проверки',
  'Подготовка',
  'Разбор ошибок',
  'Тренировки',
  'Материалы'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'tutoring';

-- Онлайн-курсы
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Материалы',
  'Видео',
  'Домашка',
  'Тесты',
  'Куратор',
  'Темы',
  'Длительность',
  'Сертификат',
  'Практика',
  'Проверка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'online-courses';

-- Языки
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Язык',
  'Уровень',
  'Грамматика',
  'Разговорная практика',
  'Аудирование',
  'Письмо',
  'Чтение',
  'Произношение',
  'Домашние задания',
  'Сертификация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'languages';

-- IT-обучение
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Язык программирования',
  'Теория',
  'Практика',
  'Проекты',
  'Code review',
  'Git',
  'Алгоритмы',
  'Тесты',
  'Портфолио',
  'Трудоустройство'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'it-training';

-- Бизнес-обучение
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Тема',
  'Тренинги',
  'Практика',
  'Кейсы',
  'Материалы',
  'Шаблоны',
  'Чек-листы',
  'Поддержка',
  'Сертификат',
  'Консультации'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'business-training';

-- Портретная съемка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Локация/студия',
  'Количество фото',
  'Свет',
  'Ретушь',
  'Цветокоррекция',
  'Образы',
  'Реквизит',
  'Макияж',
  'Исходники',
  'Срок выдачи'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'portrait-photography';

-- Предметная съемка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Количество товаров',
  'Ракурсы',
  'Белый фон',
  'Контекст',
  'Свет',
  'Обработка',
  'Ретушь',
  'Форматы',
  'Исходники',
  'Срочность'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'product-photography';

-- Ретушь
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Цвет',
  'Ликвид',
  'Ретушь',
  'Кожа',
  'Контраст',
  'Свет',
  'Удаление объектов',
  'Фильтр',
  'Кадрирование',
  'RAW обработка'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'retouching';

-- Событийная съемка
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Часы съемки',
  'Фотограф',
  'Обработка',
  'Количество фото',
  'Альбом',
  'Печать',
  'Видео',
  'Дрон',
  'Исходники',
  'Срок выдачи'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'event-photography';

-- Обработка фото
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Количество фото',
  'Цветокоррекция',
  'Ретушь',
  'Фильтры',
  'Свет',
  'Контраст',
  'Резкость',
  'Удаление объектов',
  'Форматы',
  'Срочность'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'photo-editing';

-- 3D-моделирование
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Low poly',
  'High poly',
  'Материалы',
  'Текстуры',
  'UV-развертка',
  'Риггинг',
  'Топология',
  'Форматы (FBX/OBJ)',
  'Оптимизация',
  'Референсы'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = '3d-modeling';

-- 3D-анимация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Персонажи',
  'Объекты',
  'Хронометраж',
  'Риггинг',
  'Циклы',
  'Камера',
  'Освещение',
  'Рендер',
  'Композитинг',
  'Форматы'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = '3d-animation-work';

-- Визуализация
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Интерьер',
  'Экстерьер',
  'Освещение',
  'Материалы',
  '3D модели',
  'Камера',
  'Атмосфера',
  'Рендер',
  'Пост-обработка',
  'Стиль'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'visualization';

-- Рендеринг
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Движок (V-Ray/Corona)',
  'Разрешение',
  'Качество',
  'Освещение',
  'Материалы',
  'Пост-обработка',
  'Количество ракурсов',
  'Анимация',
  'Формат',
  'Сроки'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'rendering';

-- Game Art
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Персонажи',
  'Окружение',
  'Props',
  'Текстуры',
  'Low poly',
  'UV-развертка',
  'PBR материалы',
  'Концепт-арт',
  'Форматы',
  'Оптимизация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'game-art';

-- Архитектурное проектирование
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'План',
  'Схема',
  'Модули',
  'Комнаты',
  'Размеры',
  'Материалы',
  'Инженерия',
  'Фасад',
  'Интерьер',
  'Техплан'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'architectural-design';

-- Дизайн интерьеров
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Планировка',
  'Стиль',
  '3D визуализация',
  'Мебель',
  'Освещение',
  'Материалы',
  'Цвета',
  'Чертежи',
  'Смета',
  'Реализация'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'interior-design';

-- Ландшафтный дизайн
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Планировка',
  'Растения',
  'Дорожки',
  'Освещение',
  'Полив',
  'Зонирование',
  '3D визуализация',
  'Смета',
  'Чертежи',
  'Сопровождение'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'landscape-design';

-- BIM проектирование
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'Revit',
  'ArchiCAD',
  'Модель',
  'Чертежи',
  'Спецификации',
  'Координация',
  'LOD',
  'Коллизии',
  'Документация',
  'Экспорт'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'bim-design';

-- Чертежи и планы
INSERT INTO subcategory_features (subcategory_id, name, sort_order)
SELECT s.id, unnest(ARRAY[
  'AutoCAD',
  'План',
  'Фасад',
  'Разрезы',
  'Размеры',
  'Спецификации',
  'Узлы',
  'Масштаб',
  'Стандарты',
  'PDF'
]), generate_series(1, 10)
FROM subcategories s
WHERE s.slug = 'drawings-plans';
