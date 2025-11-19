/*
  # Fix RLS policies for all tables (corrected)

  1. Tables Updated
    - Enable RLS on all tables
    - Add policies for authenticated users

  2. Security
    - profiles: users can read/update own profile
    - wallet_ledger: users can read own entries
    - chats: users can read own chats (text IDs)
    - messages: users can read messages in own chats
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- WALLET_LEDGER (already has RLS, ensure policies exist)
ALTER TABLE IF EXISTS public.wallet_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_reads_own_ledger" ON public.wallet_ledger;
CREATE POLICY "user_reads_own_ledger"
  ON public.wallet_ledger
  FOR SELECT
  USING (auth.uid() = user_id);

-- CHATS (participant IDs are text)
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chats_read_own" ON public.chats;
CREATE POLICY "chats_read_own"
  ON public.chats
  FOR SELECT
  USING (auth.uid()::text = participant1_id OR auth.uid()::text = participant2_id);

DROP POLICY IF EXISTS "chats_insert_own" ON public.chats;
CREATE POLICY "chats_insert_own"
  ON public.chats
  FOR INSERT
  WITH CHECK (auth.uid()::text = participant1_id OR auth.uid()::text = participant2_id);

DROP POLICY IF EXISTS "chats_update_own" ON public.chats;
CREATE POLICY "chats_update_own"
  ON public.chats
  FOR UPDATE
  USING (auth.uid()::text = participant1_id OR auth.uid()::text = participant2_id);

-- MESSAGES
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_read_own" ON public.messages;
CREATE POLICY "messages_read_own"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.participant1_id = auth.uid()::text OR chats.participant2_id = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id);

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
