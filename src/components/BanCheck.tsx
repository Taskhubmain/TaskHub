import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BanCheckProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES_WHEN_BANNED = [
  '/',
  '/404',
  '/wallet',
  '/profile',
  '/me/portfolio/add',
  '/security-settings',
  '/payment-methods',
  '/notifications',
  '/settings/profile',
  '/settings/security'
];

export function BanCheck({ children }: BanCheckProps) {
  const { user } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentRoute = window.location.hash.slice(1) || '/';

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .maybeSingle();

      setIsBanned(!!data?.is_banned);
      setLoading(false);
    };

    checkBanStatus();

    const subscription = supabase
      .channel('profile_ban_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload: any) => {
          if (payload.new.is_banned !== undefined) {
            setIsBanned(payload.new.is_banned);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return <>{children}</>;
  }

  const isRouteAllowed = ALLOWED_ROUTES_WHEN_BANNED.some(route =>
    currentRoute === route || currentRoute.startsWith(route + '/')
  );

  if (isBanned && !isRouteAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ ограничен</h2>
            <p className="text-gray-600 mb-6">
              Ваш аккаунт заблокирован. Доступ к этой странице ограничен.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Вы можете использовать следующие разделы:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.hash = '/'}
                className="w-full px-4 py-2 bg-[#6FE7C8] hover:bg-[#3F7F6E] text-white rounded-lg transition-colors"
              >
                Главная
              </button>
              <button
                onClick={() => window.location.hash = '/profile'}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Профиль
              </button>
              <button
                onClick={() => window.location.hash = '/wallet'}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Кошелек
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
