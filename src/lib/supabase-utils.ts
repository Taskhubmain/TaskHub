import { getSupabase } from './supabaseClient';

interface RetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
}

export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const { maxRetries = 3, timeoutMs = 8000, retryDelayMs = 1000 } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        )
      ]);

      if (result.error) {
        lastError = result.error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
          continue;
        }
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      }
    }
  }

  return { data: null, error: lastError };
}

export async function subscribeWithMonitoring(
  channelName: string,
  config: {
    table: string;
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    filter?: string;
    callback: (payload: any) => void;
    onError?: () => void;
    onReconnect?: () => void;
  }
) {
  const { table, event, filter, callback, onError, onReconnect } = config;

  let currentChannel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let isReconnecting = false;

  const createSubscription = () => {
    const supabase = getSupabase();
    const channel = supabase.channel(channelName);

    const subscriptionConfig: any = {
      event,
      schema: 'public',
      table
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    currentChannel = channel
      .on('postgres_changes', subscriptionConfig, callback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed: ${channelName}`);
          reconnectAttempts = 0;
          isReconnecting = false;
          if (onReconnect) onReconnect();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ Subscription error: ${channelName}`);
          if (onError) onError();

          if (!isReconnecting && reconnectAttempts < maxReconnectAttempts) {
            isReconnecting = true;
            reconnectAttempts++;
            console.log(`Attempting to reconnect subscription ${reconnectAttempts}/${maxReconnectAttempts}...`);

            setTimeout(() => {
              if (currentChannel) {
                currentChannel.unsubscribe();
              }
              createSubscription();
            }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
          }
        }
      });

    return currentChannel;
  };

  return createSubscription();
}

export async function executeQuery<T>(
  queryFn: (client: ReturnType<typeof getSupabase>) => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  return queryWithRetry(() => {
    const client = getSupabase();
    return queryFn(client);
  }, options);
}
