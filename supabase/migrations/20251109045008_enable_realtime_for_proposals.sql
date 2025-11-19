/*
  # Enable Realtime for Proposals Table

  1. Changes
    - Enable realtime publication for the proposals table to allow instant updates
    - This will make proposal submissions appear immediately without page refresh

  2. Important Notes
    - Clients can subscribe to changes on the proposals table
    - Updates will be pushed instantly to all subscribers
*/

-- Enable realtime for proposals table
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
