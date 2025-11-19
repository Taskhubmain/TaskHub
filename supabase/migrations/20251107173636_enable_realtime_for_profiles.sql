/*
  # Enable realtime for profiles table

  1. Changes
    - Enable realtime replication for profiles table
  
  2. Purpose
    - Allow NavBar to receive instant updates when unread_messages_count changes
    - Enable realtime subscriptions to profiles table
*/

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;