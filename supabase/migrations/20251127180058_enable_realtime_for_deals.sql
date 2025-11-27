/*
  # Enable Realtime for Deals Table

  1. Changes
    - Enable realtime replication for deals table
    - Enable realtime replication for deal_progress_reports table
    - This allows instant updates when deal progress changes
  
  2. Why This Is Important
    - Clients and freelancers need to see progress updates in real-time
    - Progress bar and reports should update immediately without page refresh
    - Improves user experience with instant feedback
  
  3. Security
    - RLS policies already in place control who can see what
    - Realtime respects existing RLS policies
*/

-- Enable realtime for deals table
ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- Enable realtime for deal_progress_reports table
ALTER PUBLICATION supabase_realtime ADD TABLE deal_progress_reports;

-- Ensure REPLICA IDENTITY is set for proper realtime updates
ALTER TABLE deals REPLICA IDENTITY FULL;
ALTER TABLE deal_progress_reports REPLICA IDENTITY FULL;