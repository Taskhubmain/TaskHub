/*
  # Fix trigger functions search_path issues

  1. Changes
    - Fix `increment_proposal_count` function to use explicit schema references
    - Fix `update_profile_unread_count` function to use explicit schema references
    - Ensure functions work correctly with SECURITY DEFINER

  2. Notes
    - These functions were causing "relation 'profiles' does not exist" errors
    - Using explicit schema references (public.profiles) ensures the functions find the correct tables
*/

-- Fix increment_proposal_count function
CREATE OR REPLACE FUNCTION public.increment_proposal_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only count proposals on orders (not tasks)
  IF NEW.order_id IS NOT NULL THEN
    -- Check if we need to reset the monthly counter
    UPDATE public.profiles
    SET 
      proposals_used_this_month = CASE
        WHEN date_trunc('month', now()) > date_trunc('month', proposals_month_start)
        THEN 1
        ELSE proposals_used_this_month + 1
      END,
      proposals_month_start = CASE
        WHEN date_trunc('month', now()) > date_trunc('month', proposals_month_start)
        THEN date_trunc('month', now())
        ELSE proposals_month_start
      END
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix update_profile_unread_count function
CREATE OR REPLACE FUNCTION public.update_profile_unread_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update unread count for participants
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET unread_messages_count = public.calculate_user_unread_count(OLD.participant1_id)
    WHERE id = OLD.participant1_id::uuid;

    UPDATE public.profiles
    SET unread_messages_count = public.calculate_user_unread_count(OLD.participant2_id)
    WHERE id = OLD.participant2_id::uuid;
  ELSE
    UPDATE public.profiles
    SET unread_messages_count = public.calculate_user_unread_count(NEW.participant1_id)
    WHERE id = NEW.participant1_id::uuid;

    UPDATE public.profiles
    SET unread_messages_count = public.calculate_user_unread_count(NEW.participant2_id)
    WHERE id = NEW.participant2_id::uuid;
  END IF;

  RETURN NULL;
END;
$$;
