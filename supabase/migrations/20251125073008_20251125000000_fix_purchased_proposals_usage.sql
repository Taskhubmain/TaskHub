/*
  # Fix Purchased Proposals Usage Logic

  ## Overview
  Updates the proposal counting logic to use purchased proposals first, then monthly proposals.

  ## Changes
  1. Update `increment_proposal_count` function to:
     - Use purchased_proposals first (if available)
     - Only increment proposals_used_this_month when purchased_proposals = 0
     - Decrement purchased_proposals when used

  ## Logic Flow
  - If user has purchased proposals (purchased_proposals > 0):
    - Decrement purchased_proposals by 1
    - Do NOT increment proposals_used_this_month
  - If user has no purchased proposals (purchased_proposals = 0):
    - Check if need to reset monthly counter
    - Increment proposals_used_this_month by 1

  ## Important Notes
  - Purchased proposals never expire and carry over to next month
  - Monthly proposals (90) reset every month
  - Always use purchased proposals first before consuming monthly proposals
*/

-- Fix increment_proposal_count function to use purchased proposals first
CREATE OR REPLACE FUNCTION public.increment_proposal_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_purchased integer;
  v_month_start timestamptz;
  v_current_month_start timestamptz;
BEGIN
  -- Only count proposals on orders (not tasks)
  IF NEW.order_id IS NOT NULL THEN
    -- Get current values
    SELECT purchased_proposals, proposals_month_start
    INTO v_purchased, v_month_start
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Calculate current month start
    v_current_month_start := date_trunc('month', now());

    -- Check if month has changed and reset is needed
    IF date_trunc('month', v_month_start) < v_current_month_start THEN
      -- Reset monthly counter for new month
      UPDATE public.profiles
      SET
        proposals_used_this_month = 0,
        proposals_month_start = v_current_month_start
      WHERE id = NEW.user_id;

      v_purchased := COALESCE((SELECT purchased_proposals FROM public.profiles WHERE id = NEW.user_id), 0);
    END IF;

    -- Use purchased proposals first, then monthly proposals
    IF v_purchased > 0 THEN
      -- Use purchased proposal (decrement purchased_proposals, don't touch monthly counter)
      UPDATE public.profiles
      SET purchased_proposals = purchased_proposals - 1
      WHERE id = NEW.user_id;
    ELSE
      -- Use monthly proposal (increment monthly counter)
      UPDATE public.profiles
      SET proposals_used_this_month = proposals_used_this_month + 1
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;