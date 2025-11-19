/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes for all foreign keys that don't have covering indexes
    - This improves JOIN performance and query optimization

  2. Affected Tables
    - admin_settings, deals, exchange_rates, moderation_reports
    - reviews, typing_indicators, user_preferences
*/

-- admin_settings: updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_by 
  ON admin_settings(updated_by);

-- deals: chat_id, order_id, task_id foreign keys
CREATE INDEX IF NOT EXISTS idx_deals_chat_id 
  ON deals(chat_id);

CREATE INDEX IF NOT EXISTS idx_deals_order_id 
  ON deals(order_id);

CREATE INDEX IF NOT EXISTS idx_deals_task_id 
  ON deals(task_id);

-- exchange_rates: to_currency foreign key
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to_currency 
  ON exchange_rates(to_currency);

-- moderation_reports: reviewed_by foreign key
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reviewed_by 
  ON moderation_reports(reviewed_by);

-- reviews: deal_id foreign key
CREATE INDEX IF NOT EXISTS idx_reviews_deal_id 
  ON reviews(deal_id);

-- typing_indicators: user_id foreign key
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id 
  ON typing_indicators(user_id);

-- user_preferences: currency foreign key
CREATE INDEX IF NOT EXISTS idx_user_preferences_currency 
  ON user_preferences(currency);
