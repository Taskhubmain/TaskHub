/*
  # Fix remaining trigger functions with schema references

  1. Changes
    - Fix `create_wallet_for_new_user` to use explicit schema references
    - Fix `handle_new_user` to use explicit schema references
    - Fix `increment_unread_on_message_insert` to use explicit schema references
    - Fix `update_chat_on_message` to use explicit schema references
    - Fix `update_profile_ratings` to use explicit schema references

  2. Notes
    - All SECURITY DEFINER functions now use explicit schema references
    - Setting search_path to empty string prevents injection attacks
*/

-- Fix create_wallet_for_new_user function
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role,
    specialty,
    experience_years,
    skills,
    location,
    contact_telegram,
    contact_gmail,
    bio,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'FREELANCER'),
    'не указана',
    0,
    ARRAY['не указаны'],
    'не указана',
    'не указан',
    'не указан',
    'Привет! Я использую TaskHub',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix increment_unread_on_message_insert function
CREATE OR REPLACE FUNCTION public.increment_unread_on_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  chat_record RECORD;
BEGIN
  -- Get the chat record
  SELECT participant1_id, participant2_id, unread_count_p1, unread_count_p2
  INTO chat_record
  FROM public.chats
  WHERE id = NEW.chat_id;

  -- Increment unread count ONLY for the recipient (not the sender)
  IF chat_record.participant1_id = NEW.sender_id THEN
    -- Sender is participant1, so increment count for participant2 (recipient)
    UPDATE public.chats
    SET 
      unread_count_p2 = unread_count_p2 + 1,
      last_message_at = NEW.created_at,
      last_message_text = COALESCE(NEW.text, 
        CASE 
          WHEN NEW.file_type = 'image' THEN '📷 Изображение'
          WHEN NEW.file_type = 'video' THEN '🎥 Видео'
          WHEN NEW.file_url IS NOT NULL THEN '📎 Файл'
          ELSE ''
        END
      )
    WHERE id = NEW.chat_id;
  ELSIF chat_record.participant2_id = NEW.sender_id THEN
    -- Sender is participant2, so increment count for participant1 (recipient)
    UPDATE public.chats
    SET 
      unread_count_p1 = unread_count_p1 + 1,
      last_message_at = NEW.created_at,
      last_message_text = COALESCE(NEW.text,
        CASE 
          WHEN NEW.file_type = 'image' THEN '📷 Изображение'
          WHEN NEW.file_type = 'video' THEN '🎥 Видео'
          WHEN NEW.file_url IS NOT NULL THEN '📎 Файл'
          ELSE ''
        END
      )
    WHERE id = NEW.chat_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix update_chat_on_message function
CREATE OR REPLACE FUNCTION public.update_chat_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.chats
  SET 
    last_message_text = COALESCE(NEW.text, 'Файл'),
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_count_p1 = CASE 
      WHEN NEW.sender_id = participant2_id THEN unread_count_p1 + 1
      ELSE unread_count_p1
    END,
    unread_count_p2 = CASE 
      WHEN NEW.sender_id = participant1_id THEN unread_count_p2 + 1
      ELSE unread_count_p2
    END
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$;

-- Fix update_profile_ratings function
CREATE OR REPLACE FUNCTION public.update_profile_ratings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update avg_rating and reviews_count
  UPDATE public.profiles
  SET
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    five_star_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      JOIN public.deals d ON r.deal_id = d.id
      WHERE r.reviewee_id = NEW.reviewee_id
      AND r.rating = 5
      AND d.status = 'completed'
    )
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$;
