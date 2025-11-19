/*
  # Add View Count Update Functions

  1. Changes
    - Create function to update order views count
    - Create function to update task views count
    - These functions can be called by anyone to update view counts

  2. Notes
    - Functions are SECURITY DEFINER to bypass RLS
    - They only update the views_count field based on actual view records
*/

-- Function to update order views count
CREATE OR REPLACE FUNCTION update_order_views_count(p_order_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET views_count = (
    SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address))
    FROM order_views
    WHERE order_id = p_order_id
  )
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task views count
CREATE OR REPLACE FUNCTION update_task_views_count(p_task_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET views_count = (
    SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address))
    FROM task_views
    WHERE task_id = p_task_id
  )
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION update_order_views_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_task_views_count TO authenticated, anon;
