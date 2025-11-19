import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, User, LogOut, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase, resetSupabase } from '@/lib/supabaseClient';
import { useSupabaseKeepAlive } from '@/hooks/useSupabaseKeepAlive';
import { queryWithRetry, subscribeWithMonitoring } from '@/lib/supabase-utils';
import { useTranslation } from '@/hooks/useTranslation';
import RegionSelector from './RegionSelector';

export default function NavBar() {
  const { t, language } = useTranslation();

  // Links are recreated on every render when language changes
  const PUBLIC_LINKS = [
    { href: '#/market', label: t('nav.market') },
    { href: '#/learning', label: t('nav.learning') },
    { href: '#/categories', label: t('nav.categories') },
    { href: '#/login', label: t('nav.entrance') },
    { href: '#/terms', label: t('nav.termsOfUse') }
  ];

  const PRIVATE_LINKS = [
    { href: '#/market', label: t('nav.market') },
    { href: '#/my-deals', label: t('nav.myDeals') },
    { href: '#/proposals', label: t('nav.proposals') },
    { href: '#/messages', label: t('nav.messages') },
    { href: '#/wallet', label: t('nav.wallet') },
    { href: '#/me', label: t('nav.profile') }
  ];

  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasNewDeals, setHasNewDeals] = useState(false);
  const [hasNewProposals, setHasNewProposals] = useState(false);
  const [hasWalletUpdate, setHasWalletUpdate] = useState(false);
  const [learningCompleted, setLearningCompleted] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const checkLearningStatus = async () => {
    if (!user) {
      setLearningCompleted(false);
      return;
    }
    const { data } = await queryWithRetry(() =>
      getSupabase()
        .from('profiles')
        .select('learning_completed')
        .eq('id', user.id)
        .maybeSingle()
    );
    setLearningCompleted(data?.learning_completed || false);
  };

  const computeHasUnread = async () => {
    if (!user) {
      setHasUnread(false);
      return;
    }
    const { data, error } = await queryWithRetry(() =>
      getSupabase()
        .from('chats')
        .select('id, participant1_id, participant2_id, unread_count_p1, unread_count_p2')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    );
    if (error) {
      setHasUnread(false);
      return;
    }
    const anyUnread = (data || []).some((c: any) =>
      c.participant1_id === user.id ? (c.unread_count_p1 || 0) > 0 : (c.unread_count_p2 || 0) > 0
    );
    setHasUnread(anyUnread);
  };

  const computeNotifications = async () => {
    if (!user) {
      setHasNewDeals(false);
      setHasNewProposals(false);
      setHasWalletUpdate(false);
      return;
    }

    const viewedDealsStr = localStorage.getItem(`viewed_deals_${user.id}`);
    let viewedDeals = viewedDealsStr ? JSON.parse(viewedDealsStr) : null;

    if (!viewedDeals) {
      viewedDeals = { timestamp: Date.now() };
      localStorage.setItem(`viewed_deals_${user.id}`, JSON.stringify(viewedDeals));
      setHasNewDeals(false);
    } else {
      const { data: dealsData } = await queryWithRetry(() =>
        getSupabase()
          .from('deals')
          .select('id, created_at')
          .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
          .gte('created_at', new Date(viewedDeals.timestamp).toISOString())
      );

      setHasNewDeals((dealsData?.length || 0) > 0);
    }

    const viewedProposalsStr = localStorage.getItem(`viewed_proposals_${user.id}`);
    let viewedProposals = viewedProposalsStr ? JSON.parse(viewedProposalsStr) : null;

    if (!viewedProposals) {
      viewedProposals = { timestamp: Date.now() };
      localStorage.setItem(`viewed_proposals_${user.id}`, JSON.stringify(viewedProposals));
      setHasNewProposals(false);
    } else {
      const { data: ordersData } = await queryWithRetry(() =>
        getSupabase()
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
      );

      const { data: tasksData } = await queryWithRetry(() =>
        getSupabase()
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
      );

      const orderIds = ordersData?.map(o => o.id) || [];
      const taskIds = tasksData?.map(t => t.id) || [];

      if (orderIds.length > 0 || taskIds.length > 0) {
        const { data: proposalsData } = await queryWithRetry(() =>
          getSupabase()
            .from('proposals')
            .select('id, created_at')
            .or(`order_id.in.(${orderIds.join(',')}),task_id.in.(${taskIds.join(',')})`)
            .gte('created_at', new Date(viewedProposals.timestamp).toISOString())
        );

        setHasNewProposals((proposalsData?.length || 0) > 0);
      } else {
        setHasNewProposals(false);
      }
    }

    const viewedWalletStr = localStorage.getItem(`viewed_wallet_${user.id}`);
    let viewedWallet = viewedWalletStr ? JSON.parse(viewedWalletStr) : null;

    if (!viewedWallet) {
      const { data: profileData } = await queryWithRetry(() =>
        getSupabase()
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .maybeSingle()
      );

      const currentBalance = profileData?.balance || 0;
      viewedWallet = { balance: currentBalance };
      localStorage.setItem(`viewed_wallet_${user.id}`, JSON.stringify(viewedWallet));
      setHasWalletUpdate(false);
    } else {
      const { data: profileData } = await queryWithRetry(() =>
        getSupabase()
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .maybeSingle()
      );

      const currentBalance = profileData?.balance || 0;
      setHasWalletUpdate(currentBalance !== viewedWallet.balance);
    }
  };

  useSupabaseKeepAlive({
    onRecover: async () => {
      await resetSupabase();
      await computeHasUnread();
    },
    intervalMs: 90_000,
    headTable: 'profiles'
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      setMobileMenuOpen(false);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!user) return;

    checkLearningStatus();
    computeHasUnread();
    computeNotifications();
    const interval = setInterval(() => {
      computeHasUnread();
      computeNotifications();
    }, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        computeHasUnread();
        computeNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let chatsSub: any = null;
    let dealsSub: any = null;
    let proposalsSub: any = null;
    let profilesSub: any = null;

    subscribeWithMonitoring('navbar-chats-unread', {
      table: 'chats',
      event: '*',
      callback: () => computeHasUnread(),
      onError: () => setTimeout(computeHasUnread, 1200)
    }).then(s => (chatsSub = s));

    subscribeWithMonitoring('navbar-deals', {
      table: 'deals',
      event: '*',
      callback: () => computeNotifications(),
      onError: () => setTimeout(computeNotifications, 1200)
    }).then(s => (dealsSub = s));

    subscribeWithMonitoring('navbar-proposals', {
      table: 'proposals',
      event: '*',
      callback: () => computeNotifications(),
      onError: () => setTimeout(computeNotifications, 1200)
    }).then(s => (proposalsSub = s));

    subscribeWithMonitoring('navbar-profiles', {
      table: 'profiles',
      event: 'UPDATE',
      filter: `id=eq.${user.id}`,
      callback: () => {
        checkLearningStatus();
        computeNotifications();
      },
      onError: () => setTimeout(computeNotifications, 1200)
    }).then(s => (profilesSub = s));

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      chatsSub?.unsubscribe?.();
      dealsSub?.unsubscribe?.();
      proposalsSub?.unsubscribe?.();
      profilesSub?.unsubscribe?.();
    };
  }, [user?.id]);

  const isActiveLink = (href: string) => {
    const path = href.replace('#', '');
    const current = currentHash.replace('#', '') || '/';
    if (path === '/' && current === '/') return true;
    if (path !== '/' && current.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#6FE7C8]/30 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95">
      <div className="mx-auto max-w-7xl px-3 xs-375:px-4 sm:px-6 lg:px-8 h-14 xs-375:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 xs-375:gap-3">
          <Sparkles className="h-4 w-4 xs-375:h-5 xs-375:w-5 text-[#6FE7C8]" />
          <a href="#/" className="font-bold text-sm xs-375:text-base tracking-tight hover:text-[#6FE7C8] transition">
            TaskHub
          </a>
          <Badge className="ml-1 xs-375:ml-2 text-xs" variant="secondary">beta</Badge>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm">
          {(isAuthenticated ? PRIVATE_LINKS : PUBLIC_LINKS).map((link) => {
            const isMessages = link.label === 'Сообщения';
            const isDeals = link.label === 'Мои сделки';
            const isProposals = link.label === 'Отклики';
            const isWallet = link.label === 'Кошелёк';
            const showBadge =
              (isMessages && hasUnread) ||
              (isDeals && hasNewDeals) ||
              (isProposals && hasNewProposals) ||
              (isWallet && hasWalletUpdate);
            return (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium relative ${
                  isActiveLink(link.href) ? 'text-[#6FE7C8]' : 'text-[#3F7F6E] hover:text-foreground'
                }`}
              >
                {link.label}
                {isAuthenticated && showBadge && (
                  <span
                    aria-label="Есть обновления"
                    className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-[#6FE7C8]"
                  />
                )}
              </a>
            );
          })}
          {isAuthenticated && learningCompleted && (
            <a
              href="#/learning"
              className={`transition-colors font-medium relative ${
                isActiveLink('#/learning') ? 'text-[#6FE7C8]' : 'text-[#3F7F6E] hover:text-foreground'
              }`}
            >
              Обучение
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <RegionSelector />
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <a href="#/me" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#6FE7C8]" />
                  <span className="font-medium">{user?.profile?.name}</span>
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <a href="#/login">{t('common.login')}</a>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <a href="#/register">{t('common.register')}</a>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#6FE7C8] bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {(isAuthenticated ? PRIVATE_LINKS : PUBLIC_LINKS).map((link) => {
              const isMessages = link.label === t('nav.messages');
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActiveLink(link.href)
                      ? 'bg-[#EFFFF8]/80 backdrop-blur text-[#6FE7C8]'
                      : 'text-[#3F7F6E] hover:bg-[#EFFFF8]/80 hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {link.label}
                    {isAuthenticated && isMessages && hasUnread && (
                      <span aria-hidden="true" className="ml-2 h-2 w-2 rounded-full bg-[#6FE7C8]" />
                    )}
                  </span>
                </a>
              );
            })}
            <div className="pt-3 space-y-2 border-t border-[#6FE7C8]/20">
              {isAuthenticated ? (
                <>
                  <a
                    href="#/me"
                    className="px-3 py-2 text-sm font-medium text-[#3F7F6E] flex items-center gap-2 hover:bg-[#EFFFF8]/80 rounded-md"
                  >
                    <User className="h-4 w-4 text-[#6FE7C8]" />
                    {user?.profile?.name}
                  </a>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50/80"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="#/login"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-[#3F7F6E] hover:bg-[#EFFFF8]/80 hover:text-foreground"
                  >
                    {t('common.login')}
                  </a>
                  <a
                    href="#/register"
                    className="block px-3 py-2 rounded-md text-sm font-medium bg-[#6FE7C8] text-white hover:bg-[#5DD6B7]"
                  >
                    {t('common.register')}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && !learningCompleted && (
        <div className="bg-blue-500/10 backdrop-blur-xl border-b border-blue-200/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100/60 backdrop-blur">
                  <GraduationCap className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t('learning.completeProfile')}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t('learning.subtitle')}
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-blue-600/90 hover:bg-blue-700 text-white shrink-0 px-6 backdrop-blur-sm"
              >
                <a href="#/learning">{t('learning.getStarted')}</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
