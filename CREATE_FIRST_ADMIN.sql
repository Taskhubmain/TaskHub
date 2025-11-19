-- ========================================
-- СОЗДАНИЕ ПЕРВОГО АДМИНИСТРАТОРА
-- ========================================
-- Выполните этот скрипт в Supabase SQL Editor
-- после регистрации через интерфейс приложения

-- Вариант 1: Установить роль ADMIN для существующего пользователя по email
UPDATE profiles
SET role = 'ADMIN'
WHERE email = 'tamilovdanil5@gmail.com';

-- Вариант 2: Установить роль ADMIN для существующего пользователя по ID
-- UPDATE profiles
-- SET role = 'ADMIN'
-- WHERE id = 'your-user-id-here';

-- Проверка: Посмотреть всех администраторов
SELECT id, name, email, role, created_at
FROM profiles
WHERE role = 'ADMIN';

-- Проверка: Посмотреть всех пользователей с их ролями
SELECT id, name, email, role, created_at
FROM profiles
ORDER BY created_at DESC;

-- ========================================
-- ДОПОЛНИТЕЛЬНЫЕ ПОЛЕЗНЫЕ ЗАПРОСЫ
-- ========================================

-- Установить комиссию платформы (по умолчанию 10%)
-- INSERT INTO admin_settings (commission_rate)
-- VALUES (10.00)
-- ON CONFLICT (id) DO UPDATE SET commission_rate = 10.00;

-- Посмотреть текущую комиссию
-- SELECT * FROM admin_settings;

-- Посмотреть количество пользователей по ролям
-- SELECT role, COUNT(*) as count
-- FROM profiles
-- GROUP BY role;
