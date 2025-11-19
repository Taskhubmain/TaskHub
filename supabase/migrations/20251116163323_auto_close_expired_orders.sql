/*
  # Auto-close expired orders

  1. Changes
    - Create function to automatically close orders past their deadline
    - This function can be called periodically or on-demand
    - Orders with deadline < current date and status = 'open' will be set to 'closed'
  
  2. Notes
    - Only affects orders with a deadline set
    - Only closes orders that are currently 'open'
*/

-- Function to close expired orders
CREATE OR REPLACE FUNCTION close_expired_orders()
RETURNS TABLE(closed_count bigint) AS $$
BEGIN
  -- Update expired orders to closed status
  WITH updated AS (
    UPDATE orders
    SET 
      status = 'closed',
      updated_at = now()
    WHERE 
      status = 'open' 
      AND deadline IS NOT NULL 
      AND deadline < CURRENT_DATE
    RETURNING id
  )
  SELECT count(*) FROM updated INTO closed_count;
  
  RETURN QUERY SELECT closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
