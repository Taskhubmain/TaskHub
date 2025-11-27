/*
  # Add No-Translate Markers to Existing System Messages
  
  1. Updates
    - Adds [[...]] markers around user names and order/task titles in existing system messages
    - This prevents Weglot from translating names and titles
  
  2. Changes
    - Updates messages matching pattern: "Заказ/Объявление "..." был принят ... заказчик - ..., исполнитель - ..."
    - Wraps order/task title in [[...]]
    - Wraps client and freelancer names in [[...]]
  
  3. Notes
    - Only affects system messages without existing markers
    - Preserves all other message content
    - Handles both Russian and English messages
*/

-- Function to add markers to deal accepted messages
CREATE OR REPLACE FUNCTION add_notranslate_markers_to_message(msg TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- If message already has markers, return as is
  IF msg ~ '\[\[.*?\]\]' THEN
    RETURN msg;
  END IF;
  
  result := msg;
  
  -- Russian pattern: Заказ "..." был принят ... заказчик - ..., исполнитель - ...
  -- Add markers around title in quotes
  result := regexp_replace(result, '(Заказ|Объявление) "([^"]+)"', '\1 [["\2"]]', 'g');
  result := regexp_replace(result, '(Order|Task) "([^"]+)"', '\1 [["\2"]]', 'g');
  
  -- Add markers around client name after "заказчик - " or "client - "
  result := regexp_replace(result, '(заказчик - )([^,]+)', '\1[[\2]]', 'g');
  result := regexp_replace(result, '(client - )([^,]+)', '\1[[\2]]', 'g');
  result := regexp_replace(result, '(the customer - )([^,]+)', '\1[[\2]]', 'g');
  
  -- Add markers around freelancer name after "исполнитель - " or "freelancer - " or "executor - "
  result := regexp_replace(result, '(исполнитель - )([^.]+)\.', '\1[[\2]].', 'g');
  result := regexp_replace(result, '(freelancer - )([^.]+)\.', '\1[[\2]].', 'g');
  result := regexp_replace(result, '(the executor - )([^.]+)\.', '\1[[\2]].', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing system messages with deal accepted pattern
UPDATE messages
SET content = add_notranslate_markers_to_message(COALESCE(content, text))
WHERE (type = 'system' OR is_system = true)
  AND (content LIKE '%был принят%заказчик%исполнитель%' 
       OR content LIKE '%was accepted%client%freelancer%'
       OR content LIKE '%was accepted%customer%executor%'
       OR text LIKE '%был принят%заказчик%исполнитель%'
       OR text LIKE '%was accepted%client%freelancer%'
       OR text LIKE '%was accepted%customer%executor%')
  AND content IS NOT NULL
  AND content !~ '\[\[.*?\]\]';

UPDATE messages
SET text = add_notranslate_markers_to_message(text)
WHERE (type = 'system' OR is_system = true)
  AND (text LIKE '%был принят%заказчик%исполнитель%' 
       OR text LIKE '%was accepted%client%freelancer%'
       OR text LIKE '%was accepted%customer%executor%')
  AND text IS NOT NULL
  AND text !~ '\[\[.*?\]\]'
  AND content IS NULL;
