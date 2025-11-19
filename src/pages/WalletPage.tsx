import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Download,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';
import { useRegion } from '@/contexts/RegionContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};
const pageTransition = {
  type: 'spring' as const,
  stiffness: 140,
  damping: 20,
  mass: 0.9
};

interface WalletData {
  id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'outcome' | 'withdrawal' | 'deposit' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  completed_at?: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { currency, formatPrice, convertPrice } = useRegion();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [profileBalance, setProfileBalance] = useState<number>(0);
  const [profileCurrency, setProfileCurrency] = useState<string>('USD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const ITEMS_PER_PAGE = 15;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<{
    status: string;
    onboarding_complete: boolean;
    payouts_enabled: boolean;
  } | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);

  useEffect(() => {
    if (user) {
      const init = async () => {
        await cleanupExpiredDeposits();
        await loadProfileBalance();
        getSupabase()
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              localStorage.setItem(`viewed_wallet_${user.id}`, JSON.stringify({ balance: data.balance || 0 }));
            }
          });
        await loadWalletData();
        await loadTransactions();
        loadStripeStatus();
      };
      init();

      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const depositStatus = urlParams.get('deposit');
      const stripeStatus = urlParams.get('stripe');

      if (depositStatus === 'success') {
        setNotification({
          type: 'success',
          title: 'Пополнение успешно',
          message: 'Средства зачислены на баланс.'
        });
        setTimeout(() => setNotification(null), 5000);
        loadProfileBalance();
        loadWalletData();
        loadTransactions();
        window.history.replaceState({}, '', '#/wallet');
      } else if (depositStatus === 'cancelled') {
        setNotification({
          type: 'info',
          title: 'Платёж отменён',
          message: 'Оплата не была завершена. С вашего счёта деньги не списаны.'
        });
        setTimeout(() => setNotification(null), 5000);
        window.history.replaceState({}, '', '#/wallet');
      } else if (stripeStatus === 'onboarding_return') {
        setNotification({
          type: 'success',
          title: 'Stripe подключён',
          message: 'Ваш Stripe аккаунт успешно настроен для выводов.'
        });
        setTimeout(() => setNotification(null), 5000);
        window.history.replaceState({}, '', '#/wallet');
      } else if (stripeStatus === 'onboarding_refresh') {
        setNotification({
          type: 'info',
          title: 'Продолжите настройку',
          message: 'Для завершения подключения Stripe необходимо заполнить все данные.'
        });
        setTimeout(() => setNotification(null), 5000);
      }

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadProfileBalance();
          loadWalletData();
          loadTransactions();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTransactions(1);
    }
  }, [filterType, filterStatus, searchQuery]);

  const cleanupExpiredDeposits = async () => {
    try {
      console.log('[WalletPage] Starting cleanup of expired deposits...');
      const supabase = getSupabase();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const session = (await supabase.auth.getSession()).data.session;

      const response = await fetch(`${supabaseUrl}/functions/v1/cleanup-expired-deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      console.log('[WalletPage] Cleanup result:', result);

      if (result.expired_count > 0) {
        console.log(`[WalletPage] Expired ${result.expired_count} deposits - refreshing transaction list`);
        await loadTransactions();
      }
    } catch (error) {
      console.error('[WalletPage] Failed to cleanup expired deposits:', error);
    }
  };

  const loadProfileBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('balance, currency')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfileBalance(data.balance || 0);
        setProfileCurrency(data.currency || 'USD');
      }
    } catch (error) {
      console.error('Error loading profile balance:', error);
    }
  };

  const loadWalletData = async () => {
    if (!user) return;

    try {
      const { data, error } = await getSupabase()
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setWallet(data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (page = 1) => {
    if (!user) return;

    try {
      const { data: walletData } = await getSupabase()
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!walletData) return;

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Build query with filters
      let countQuery = getSupabase()
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('wallet_id', walletData.id);

      let dataQuery = getSupabase()
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletData.id);

      // Apply filters
      if (filterType !== 'all') {
        countQuery = countQuery.eq('type', filterType);
        dataQuery = dataQuery.eq('type', filterType);
      }

      if (filterStatus !== 'all') {
        countQuery = countQuery.eq('status', filterStatus);
        dataQuery = dataQuery.eq('status', filterStatus);
      }

      if (searchQuery) {
        countQuery = countQuery.ilike('description', `%${searchQuery}%`);
        dataQuery = dataQuery.ilike('description', `%${searchQuery}%`);
      }

      // Get total count with filters
      const { count } = await countQuery;
      setTotalTransactions(count || 0);

      // Get paginated data with filters
      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTransactions(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadStripeStatus = async () => {
    if (!user) return;

    setLoadingStripeStatus(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-account-status`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStripeConnectStatus(data);
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error);
    } finally {
      setLoadingStripeStatus(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setNotification({
          type: 'error',
          title: 'Ошибка авторизации',
          message: 'Необходимо войти в систему'
        });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-account-link`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать ссылку для подключения');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      setNotification({
        type: 'error',
        title: 'Ошибка подключения',
        message: (error as Error).message
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !wallet || !withdrawAmount || isSubmittingWithdraw) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > wallet.balance) {
      setNotification({
        type: 'error',
        title: 'Некорректная сумма',
        message: 'Сумма вывода должна быть больше 0 и не превышать доступный баланс'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (!stripeConnectStatus || stripeConnectStatus.status !== 'connected' || !stripeConnectStatus.payouts_enabled) {
      setNotification({
        type: 'error',
        title: 'Stripe не подключён',
        message: 'Для вывода средств необходимо подключить и настроить Stripe аккаунт'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsSubmittingWithdraw(true);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setNotification({
          type: 'error',
          title: 'Ошибка авторизации',
          message: 'Необходимо войти в систему'
        });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-wallet-withdrawal`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
          currency: profileCurrency
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать запрос на вывод');
      }

      setNotification({
        type: 'success',
        title: 'Запрос на вывод создан',
        message: 'Средства будут переведены на ваш Stripe аккаунт в ближайшее время'
      });
      setTimeout(() => setNotification(null), 5000);

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setIsSubmittingWithdraw(false);
      await loadProfileBalance();
      await loadWalletData();
      await loadTransactions();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      setNotification({
        type: 'error',
        title: 'Ошибка вывода',
        message: (error as Error).message
      });
      setTimeout(() => setNotification(null), 5000);
      setIsSubmittingWithdraw(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount || isSubmittingDeposit) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0 || isNaN(amount)) {
      alert('Некорректная сумма для пополнения');
      return;
    }

    setIsSubmittingDeposit(true);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Ошибка авторизации');
        setIsSubmittingDeposit(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-wallet-topup-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
          currency: profileCurrency,
          idempotency_key: idempotencyKey
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать сессию оплаты');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL для оплаты не получен');
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      alert('Ошибка при создании платежа: ' + (error as Error).message);
      setIsSubmittingDeposit(false);
    }
  };

  // Transactions are now filtered on the server, so we use them directly
  const filteredTransactions = transactions;

  const getTransactionIcon = (type: string) => {
    if (type === 'income' || type === 'deposit') {
      return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === 'income' || type === 'deposit') return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'destructive',
      expired: 'outline',
      blocked: 'destructive',
      disputed: 'destructive',
      refunded: 'secondary'
    };
    const labels: Record<string, string> = {
      completed: 'Завершено',
      processing: 'Обрабатывается',
      pending: 'В обработке',
      failed: 'Ошибка',
      cancelled: 'Отменено',
      expired: 'Превышено время ожидания',
      blocked: 'Заблокировано',
      disputed: 'Спор / Чарджбэк',
      refunded: 'Возврат'
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || 'Неизвестно'}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6FE7C8] border-r-transparent"></div>
          <p className="mt-4 text-[#3F7F6E]">Загрузка кошелька...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-[#3F7F6E]">
          <Wallet className="h-12 w-12 mx-auto mb-4" />
          <p>Кошелек не найден</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="wallet"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">Кошелёк</h1>

        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg border-l-4 flex items-start justify-between backdrop-blur-md shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50/80 border-green-500 text-green-900'
                : notification.type === 'error'
                ? 'bg-red-50/80 border-red-500 text-red-900'
                : 'bg-blue-50/80 border-blue-500 text-blue-900'
            }`}
          >
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{notification.title}</h3>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        <div className="grid gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#6FE7C8] to-[#3F7F6E] text-white overflow-hidden relative">
            <CardContent className="p-8">
              <div className="absolute top-0 right-0 opacity-10">
                <Wallet className="h-48 w-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Доступный баланс
                </div>
                <div className="text-5xl font-bold mb-8">
                  {formatPrice(profileBalance, profileCurrency)}
                </div>
                {profileCurrency !== currency && (
                  <div className="text-sm opacity-80 mb-2">
                    Оригинальная сумма: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: profileCurrency,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(profileBalance)}
                  </div>
                )}
                {wallet.pending_balance > 0 && (
                  <div className="text-sm opacity-80 mb-6">
                    В обработке: ${wallet.pending_balance.toFixed(2)}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowWithdrawModal(true);
                      setIsSubmittingWithdraw(false);
                    }}
                    variant="secondary"
                    className="bg-white text-[#3F7F6E] hover:bg-white/90"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Вывести
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDepositModal(true);
                      setIdempotencyKey(crypto.randomUUID());
                      setIsSubmittingDeposit(false);
                    }}
                    variant="outline"
                    className="text-white border-white hover:bg-white/10"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Пополнить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#3F7F6E] mb-1">Всего заработано</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${wallet.total_earned.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#3F7F6E] mb-1">Всего выведено</div>
                    <div className="text-2xl font-bold text-[#3F7F6E]">
                      ${wallet.total_withdrawn.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-[#3F7F6E]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-md bg-white/60 border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Вывод средств через Stripe</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {loadingStripeStatus ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#6FE7C8] border-r-transparent"></div>
                  <p className="mt-2 text-sm text-[#3F7F6E]">Загрузка статуса...</p>
                </div>
              ) : stripeConnectStatus && stripeConnectStatus.status === 'connected' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {stripeConnectStatus.onboarding_complete && stripeConnectStatus.payouts_enabled ? (
                      <Badge variant="default" className="bg-[#6FE7C8] text-[#3F7F6E] hover:bg-[#5DD6B7]">Stripe подключён</Badge>
                    ) : stripeConnectStatus.onboarding_complete ? (
                      <>
                        <Badge variant="secondary">Настройка завершена</Badge>
                        <span className="text-sm text-gray-600">Ожидание активации выводов</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">Настройка не завершена</Badge>
                        <span className="text-sm text-gray-600">Требуется завершить onboarding</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!stripeConnectStatus.onboarding_complete && (
                      <Button
                        onClick={handleConnectStripe}
                        variant="default"
                        size="sm"
                        className="bg-[#6FE7C8] hover:bg-[#5DD6B7] text-[#3F7F6E]"
                      >
                        Продолжить настройку Stripe
                      </Button>
                    )}
                    {stripeConnectStatus.onboarding_complete && (
                      <Button
                        onClick={handleConnectStripe}
                        variant="default"
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto sm:px-6"
                      >
                        Сменить аккаунт Stripe
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 px-2 pb-2">
                  <p className="text-sm text-gray-600">
                    Для вывода средств на банковский счёт необходимо подключить Stripe аккаунт
                  </p>
                  <Button
                    onClick={handleConnectStripe}
                    variant="default"
                    className="bg-[#6FE7C8] hover:bg-[#5DD6B7] text-[#3F7F6E]"
                  >
                    Подключить Stripe для вывода
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>История транзакций</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск транзакций..."
                    className="pl-9"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">Все типы</option>
                  <option value="income">Поступления</option>
                  <option value="outcome">Расходы</option>
                  <option value="withdrawal">Выводы</option>
                  <option value="deposit">Пополнения</option>
                  <option value="fee">Комиссии</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">Все статусы</option>
                  <option value="completed">Завершено</option>
                  <option value="pending">В обработке</option>
                  <option value="failed">Ошибка</option>
                  <option value="cancelled">Отменено</option>
                  <option value="expired">Превышено время ожидания</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-[#3F7F6E]">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Нет транзакций</p>
                <p className="text-sm">История транзакций пуста</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#EFFFF8] transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="font-medium mb-1">
                          {transaction.type === 'deposit' && transaction.status === 'expired'
                            ? `Пополнение кошелька $${transaction.amount.toFixed(2)}`
                            : transaction.description}
                        </div>
                        <div className="text-sm text-[#3F7F6E] flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.created_at)}
                          {transaction.type === 'deposit' && transaction.status === 'expired' && (
                            <span className="text-xs text-amber-600 ml-2">• Превышено время ожидания</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold mb-1 ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.type === 'income' || transaction.type === 'deposit'
                          ? '+'
                          : '-'}
                        ${transaction.amount.toFixed(2)}
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalTransactions > ITEMS_PER_PAGE && (
              <div className="mt-6 mb-4 flex items-center justify-center gap-2 border-t pt-4 px-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    loadTransactions(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="h-10"
                >
                  &lt;
                </Button>

                {(() => {
                  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);
                  const pages: number[] = [];

                  if (currentPage === 1) {
                    pages.push(1);
                    if (totalPages >= 2) pages.push(2);
                    if (totalPages >= 3) pages.push(3);
                  } else if (currentPage === totalPages) {
                    if (totalPages >= 3) pages.push(totalPages - 2);
                    if (totalPages >= 2) pages.push(totalPages - 1);
                    pages.push(totalPages);
                  } else {
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    if (currentPage + 1 <= totalPages) pages.push(currentPage + 1);
                  }

                  return pages.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="default"
                      onClick={() => {
                        loadTransactions(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-10 w-10"
                    >
                      {page}
                    </Button>
                  ));
                })()}

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    loadTransactions(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage >= Math.ceil(totalTransactions / ITEMS_PER_PAGE)}
                  className="h-10"
                >
                  &gt;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md m-4">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Вывод средств</CardTitle>
                <button onClick={() => setShowWithdrawModal(false)} className="hover:opacity-70 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Доступно: ${wallet.balance.toFixed(2)}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={wallet.balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Введите сумму"
                />
              </div>
              <div className="text-sm text-[#3F7F6E]">
                Средства будут переведены на ваш счет в течение 1-3 рабочих дней
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleWithdraw}
                  className="flex-1"
                  disabled={isSubmittingWithdraw}
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Принято, ожидайте...
                    </>
                  ) : (
                    'Вывести'
                  )}
                </Button>
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmittingWithdraw}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md m-4">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Пополнение баланса</CardTitle>
                <button onClick={() => setShowDepositModal(false)} className="hover:opacity-70 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div>
                <label className="text-sm font-medium mb-2 block">Сумма пополнения</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Введите сумму"
                />
              </div>
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                После нажатия кнопки вы будете перенаправлены на защищённую страницу оплаты Stripe для безопасного проведения платежа.
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeposit}
                  className="flex-1"
                  disabled={isSubmittingDeposit}
                >
                  {isSubmittingDeposit ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Принято, ожидайте...
                    </>
                  ) : (
                    'Пополнить'
                  )}
                </Button>
                <Button
                  onClick={() => setShowDepositModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmittingDeposit}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
