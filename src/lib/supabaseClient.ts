import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function makeClient() {
  const url = import.meta.env.VITE_SUPABASE_URL || (window as any).SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Supabase environment variables missing:', { url: !!url, key: !!key });
    throw new Error('Supabase env missing');
  }

  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      },
      realtime: { params: { eventsPerSecond: 2 } }
    });

    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

export function getSupabase(): SupabaseClient {
  if (!_client) _client = makeClient();
  return _client!;
}

export async function resetSupabase(): Promise<SupabaseClient> {
  try {
    if (_client) {
      // @ts-ignore
      _client.realtime?.disconnect?.();
    }
  } catch {}
  _client = makeClient();
  // @ts-ignore
  _client.realtime?.connect?.();
  return _client!;
}

export const supabase = getSupabase();
