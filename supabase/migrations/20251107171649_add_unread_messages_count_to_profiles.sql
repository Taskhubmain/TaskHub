/*
  # Add unread messages count to profiles

  1. Changes
    - Add `unread_messages_count` column to `profiles` table
    - Create function to calculate total unread messages for a user
    - Create trigger to automatically update the count when chats change
  
  2. Purpose
    - Store total unread message count directly in user's profile
    - Eliminate need to load all chats to show badge in navigation
    - Update count automatically via database triggers
*/

-- Add unread_messages_count column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'unread_messages_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN unread_messages_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_unread_count ON profiles(unread_messages_count);

-- Function to calculate total unread messages for a user
CREATE OR REPLACE FUNCTION calculate_user_unread_count(p_user_id text)
RETURNS integer AS $$
DECLARE
  total_unread integer;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN participant1_id = p_user_id THEN unread_count_p1
      WHEN participant2_id = p_user_id THEN unread_count_p2
      ELSE 0
    END
  ), 0)
  INTO total_unread
  FROM chats
  WHERE participant1_id = p_user_id OR participant2_id = p_user_id;
  
  RETURN total_unread;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile unread count when chats change
CREATE OR REPLACE FUNCTION update_profile_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update unread count for participants
  IF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET unread_messages_count = calculate_user_unread_count(OLD.participant1_id)
    WHERE id = OLD.participant1_id::uuid;
    
    UPDATE profiles
    SET unread_messages_count = calculate_user_unread_count(OLD.participant2_id)
    WHERE id = OLD.participant2_id::uuid;
  ELSE
    UPDATE profiles
    SET unread_messages_count = calculate_user_unread_count(NEW.participant1_id)
    WHERE id = NEW.participant1_id::uuid;
    
    UPDATE profiles
    SET unread_messages_count = calculate_user_unread_count(NEW.participant2_id)
    WHERE id = NEW.participant2_id::uuid;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on chats table
DROP TRIGGER IF EXISTS trigger_update_profile_unread_count ON chats;
CREATE TRIGGER trigger_update_profile_unread_count
AFTER INSERT OR UPDATE OR DELETE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_profile_unread_count();

-- Initialize unread counts for existing users
UPDATE profiles
SET unread_messages_count = calculate_user_unread_count(id::text);