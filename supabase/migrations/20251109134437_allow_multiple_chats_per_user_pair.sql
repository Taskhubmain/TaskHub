/*
  # Allow Multiple Chats Per User Pair

  1. Changes
    - Remove `unique_participants` constraint from chats table
    - Remove `different_participants` CHECK constraint from chats table

  2. Reasoning
    - Users need multiple chats: one general chat + one chat per deal
    - The previous constraint only allowed one chat between two users
    - Each deal gets its own isolated chat for deal-specific communication
    - A separate general chat exists for non-deal communication

  3. Important Notes
    - This enables the multiple chat concept where:
      * General chat = chat without deal_id in deals table
      * Deal chats = chats with deal_id in deals table
    - Application logic ensures proper chat organization
*/

-- Drop the unique constraint that prevents multiple chats between same users
ALTER TABLE chats DROP CONSTRAINT IF EXISTS unique_participants;

-- Drop the check constraint that enforced ordering of participant IDs
ALTER TABLE chats DROP CONSTRAINT IF EXISTS different_participants;
