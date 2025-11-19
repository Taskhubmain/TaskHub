/*
  # Enable Realtime for Messages and Chats

  1. Changes
    - Enable realtime replication for messages table
    - Enable realtime replication for chats table
  
  2. Purpose
    - Allow real-time message delivery between users
    - Update chat list instantly when new messages arrive
    - No need to poll or manually refresh to see new messages
*/

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for chats table
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
