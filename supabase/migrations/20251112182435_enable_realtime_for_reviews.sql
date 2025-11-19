/*
  # Enable Realtime for Reviews Table

  ## Changes
  - Enable realtime replication for the reviews table
  - This allows clients to subscribe to INSERT/UPDATE/DELETE events on reviews
  
  ## Purpose
  - When a review is created in chat, the profile page will automatically update
  - Real-time notifications for new reviews
*/

-- Enable realtime for reviews table
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
