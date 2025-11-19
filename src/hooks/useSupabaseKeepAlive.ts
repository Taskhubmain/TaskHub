import { useEffect, useRef } from 'react';
import { getSupabase, resetSupabase } from '@/lib/supabaseClient';

export function useSupabaseKeepAlive(opts: {
  onRecover: () => Promise<void> | void;
  intervalMs?: number;
  headTable?: string;
}) {
  const failCount = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const interval = opts.intervalMs ?? 90_000;
    const headTable = opts.headTable ?? 'profiles';

    const tick = async () => {
      try {
        if (document.hidden) return;

        const supabase = getSupabase();

        // освежаем токен, если близко к истечению
        const { data: sess } = await supabase.auth.getSession();
        const exp = sess.session?.expires_at ? sess.session.expires_at * 1000 : null;
        if (exp && exp - Date.now() < 120_000) {
          await supabase.auth.refreshSession();
        }

        // лёгкий HEAD-запрос для проверки связи
        const { error } = await supabase
          .from(headTable)
          .select('id', { count: 'exact', head: true });

        if (error) throw error;

        failCount.current = 0;
      } catch {
        failCount.current += 1;
        if (failCount.current >= 2) {
          failCount.current = 0;
          await resetSupabase();
          try {
            await opts.onRecover();
          } catch {}
        }
      }
    };

    const start = () => {
      if (timer.current) window.clearInterval(timer.current);
      tick();
      timer.current = window.setInterval(tick, interval);
    };

    const onWake = () => start();
    const onOnline = () => start();

    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onWake);

    start();

    return () => {
      if (timer.current) window.clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onWake);
    };
  }, [opts.onRecover, opts.intervalMs, opts.headTable]);
}
