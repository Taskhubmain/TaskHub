import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BoostBadge } from '@/components/ui/BoostBadge';
import { ProposalLimitIndicator } from '@/components/ui/ProposalLimitIndicator';
import PriceDisplay from '@/components/PriceDisplay';
import ProfileBadges from '@/components/ui/ProfileBadges';
import StarRating from '@/components/ui/StarRating';
import CategoryFilter from '@/components/CategoryFilter';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';
import { navigateToProfile } from '@/lib/navigation';
import { optimizeImage } from '@/lib/image-optimization';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

const ITEMS_PER_PAGE = 21;

export default function MarketPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [q, setQ] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [rating, setRating] = useState('');
  const [currency, setCurrency] = useState('');
  const [engagement, setEngagement] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('new');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'order' | 'task'>('order');
  const [orders, setOrders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [userProposals, setUserProposals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [proposalLimitData, setProposalLimitData] = useState<{ used: number; monthStart: string; purchased: number } | null>(null);
  const [limitExceededDialogOpen, setLimitExceededDialogOpen] = useState(false);
  const [buyProposalsDialogOpen, setBuyProposalsDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ amount: number; price: number } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userCurrency, setUserCurrency] = useState<string>('USD');

  useEffect(() => {
    loadData();
    loadProposalLimits();

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setCategory(categoryParam);
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
        loadProposalLimits();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, q, selectedCategories, rating, currency, engagement, min, max, sort]);

  const loadProposalLimits = async () => {
    if (!user) {
      setProposalLimitData(null);
      return;
    }

    try {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('proposals_used_this_month, proposals_month_start, purchased_proposals, balance, currency')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        const monthStart = new Date(data.proposals_month_start || new Date());
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        setUserBalance(parseFloat(data.balance) || 0);
        setUserCurrency(data.currency || 'USD');

        if (monthStart < currentMonthStart) {
          setProposalLimitData({
            used: 0,
            monthStart: currentMonthStart.toISOString(),
            purchased: data.purchased_proposals || 0
          });
        } else {
          setProposalLimitData({
            used: data.proposals_used_this_month || 0,
            monthStart: data.proposals_month_start,
            purchased: data.purchased_proposals || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading proposal limits:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      // Close expired orders first
      await getSupabase().rpc('close_expired_orders');

      let ordersQuery = getSupabase()
        .from('orders')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100);

      let tasksQuery = getSupabase()
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      const [ordersRes, tasksRes] = await Promise.all([ordersQuery, tasksQuery]);

      let ordersData = ordersRes.data || [];
      let tasksData = tasksRes.data || [];

      // Получаем все заказы/задачи, у которых есть активные сделки
      const { data: activeDeals } = await getSupabase()
        .from('deals')
        .select('order_id, task_id')
        .neq('status', 'completed');

      const activeOrderIds = new Set((activeDeals || []).filter(d => d.order_id).map(d => d.order_id));
      const activeTaskIds = new Set((activeDeals || []).filter(d => d.task_id).map(d => d.task_id));

      // Фильтруем заказы и задачи, убирая те, что уже в работе
      ordersData = ordersData.filter((o: any) => !activeOrderIds.has(o.id));
      tasksData = tasksData.filter((t: any) => !activeTaskIds.has(t.id));

      setOrders(ordersData);
      setTasks(tasksData);

      const allUserIds = new Set<string>();
      ordersData.forEach((o: any) => allUserIds.add(o.user_id));
      tasksData.forEach((t: any) => allUserIds.add(t.user_id));

      if (allUserIds.size > 0) {
        const { data: profilesData } = await getSupabase()
          .from('profiles')
          .select('id, name, avatar_url, avg_rating, reviews_count, five_star_count, created_at')
          .in('id', Array.from(allUserIds));

        const profilesMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }

      if (user) {
        const orderIds = ordersData.map(o => o.id);
        const taskIds = tasksData.map(t => t.id);

        if (orderIds.length > 0 || taskIds.length > 0) {
          const conditions: string[] = [];
          if (orderIds.length > 0) conditions.push(`order_id.in.(${orderIds.join(',')})`);
          if (taskIds.length > 0) conditions.push(`task_id.in.(${taskIds.join(',')})`);

          const { data: proposalsData } = await getSupabase()
            .from('proposals')
            .select('order_id, task_id')
            .eq('user_id', user.id)
            .or(conditions.join(','));

          const proposalsMap: Record<string, boolean> = {};
          (proposalsData || []).forEach((p: any) => {
            if (p.order_id) {
              proposalsMap[`order-${p.order_id}`] = true;
            }
            if (p.task_id) {
              proposalsMap[`task-${p.task_id}`] = true;
            }
          });
          setUserProposals(proposalsMap);
        }
      }
    } catch (error) {
      setOrders([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (arr: any[]) => {
    let res = [...arr];
    if (q) {
      const s = q.toLowerCase();
      res = res.filter(o => o.title.toLowerCase().includes(s) || (o.tags || []).some((t: string) => t.toLowerCase().includes(s)));
    }
    if (selectedCategories.length > 0) {
      res = res.filter(o => selectedCategories.includes(o.category));
    }
    if (rating) {
      const minRating = parseFloat(rating);
      res = res.filter(o => {
        const profile = profiles[o.user_id];
        return profile && (profile.avg_rating || 0) >= minRating;
      });
    }
    if (currency) res = res.filter(o => o.currency === currency);
    if (activeTab === 'orders' && engagement) res = res.filter(o => o.engagement === engagement);
    const nMin = Number(min);
    const nMax = Number(max);
    if (activeTab === 'orders') {
      if (!Number.isNaN(nMin) && min !== '') res = res.filter(o => (o.price_max || 0) >= nMin);
      if (!Number.isNaN(nMax) && max !== '') res = res.filter(o => (o.price_min || 0) <= nMax);
    } else {
      if (!Number.isNaN(nMin) && min !== '') res = res.filter(o => (o.price || 0) >= nMin);
      if (!Number.isNaN(nMax) && max !== '') res = res.filter(o => (o.price || 0) <= nMax);
    }

    const boosted = res.filter(o => o.is_boosted);
    const regular = res.filter(o => !o.is_boosted);

    const sortItems = (items: any[]) => {
      if (sort === 'priceUp') return items.sort((a, b) => ((a.price_min ?? a.price) - (b.price_min ?? b.price)));
      else if (sort === 'priceDown') return items.sort((a, b) => ((b.price_max ?? b.price) - (a.price_max ?? a.price)));
      else if (sort === 'new') return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    };

    return [...sortItems(boosted), ...sortItems(regular)];
  };

  const allData = useMemo(() => {
    return activeTab === 'orders' ? applyFilters(orders) : applyFilters(tasks);
  }, [activeTab, orders, tasks, q, selectedCategories, rating, currency, engagement, min, max, sort, profiles]);

  const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);

  const data = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allData.slice(startIndex, endIndex);
  }, [allData, currentPage]);

  const reset = () => {
    setQ('');
    setSelectedCategories([]);
    setRating('');
    setCurrency('');
    setEngagement('');
    setMin('');
    setMax('');
    setSort('new');
    setCurrentPage(1);
  };

  const openPreview = async (item: any, type: 'order' | 'task') => {
    setPreviewItem(item);
    setPreviewType(type);
    setPreviewOpen(true);

    const viewData: any = {
      user_id: user?.id || null,
    };

    if (!user) {
      viewData.ip_address = 'anonymous';
    }

    if (type === 'order') {
      viewData.order_id = item.id;
      await getSupabase()
        .from('order_views')
        .insert(viewData)
        .select()
        .maybeSingle();

      await getSupabase()
        .rpc('update_order_views_count', { p_order_id: item.id });
    } else {
      viewData.task_id = item.id;
      await getSupabase()
        .from('task_views')
        .insert(viewData)
        .select()
        .maybeSingle();

      await getSupabase()
        .rpc('update_task_views_count', { p_task_id: item.id });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProposalClick = () => {
    if (!user) {
      window.location.hash = '/login';
      return;
    }

    if (previewItem.user_id === user.id) {
      alert(previewType === 'order' ? 'Вы не можете отправить отклик на свой собственный заказ' : 'Вы не можете отправить отклик на своё собственное объявление');
      return;
    }

    if (previewType === 'order' && proposalLimitData) {
      const totalAvailable = Math.max(0, 90 - proposalLimitData.used) + proposalLimitData.purchased;
      if (totalAvailable <= 0) {
        setLimitExceededDialogOpen(true);
        return;
      }
    }

    window.location.hash = `/proposals/create?type=${previewType}&id=${previewItem.id}`;
  };

  const proposalPackages = [
    { amount: 25, price: 25 },
    { amount: 50, price: 45 },
    { amount: 100, price: 80 },
    { amount: 150, price: 110 },
    { amount: 250, price: 175 }
  ];

  const handlePurchaseProposals = async () => {
    if (!user || !selectedPackage) return;

    setPurchasing(true);
    try {
      if (userBalance < selectedPackage.price) {
        alert('Недостаточно средств на балансе');
        return;
      }

      const newBalance = userBalance - selectedPackage.price;
      const newPurchased = (proposalLimitData?.purchased || 0) + selectedPackage.amount;

      const { error } = await getSupabase()
        .from('profiles')
        .update({
          balance: newBalance,
          purchased_proposals: newPurchased,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      alert(`Успешно куплено ${selectedPackage.amount} откликов!`);
      setBuyProposalsDialogOpen(false);
      setSelectedPackage(null);
      await loadProposalLimits();
    } catch (error) {
      console.error('Error purchasing proposals:', error);
      alert('Ошибка при покупке откликов');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="market"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Биржа</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                <Button variant={activeTab === 'orders' ? 'default' : 'ghost'} onClick={() => setActiveTab('orders')}>Заказы</Button>
                <Button variant={activeTab === 'tasks' ? 'default' : 'ghost'} onClick={() => setActiveTab('tasks')}>Tasks</Button>
              </div>
              {user && (
                <div className="flex gap-2">
                  {activeTab === 'orders' ? (
                    <Button
                      onClick={() => window.location.hash = '/order/new'}
                      className="bg-[#3F7F6E] hover:bg-[#2F6F5E] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Создать заказ
                    </Button>
                  ) : (
                    <Button
                      onClick={() => window.location.hash = '/task/new'}
                      className="bg-[#3F7F6E] hover:bg-[#2F6F5E] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Создать объявление
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {user && proposalLimitData && (
            <div className="mb-6">
              <ProposalLimitIndicator
                used={proposalLimitData.used}
                max={90}
                purchased={proposalLimitData.purchased}
                type={activeTab as 'orders' | 'tasks'}
                onBuyMore={() => setBuyProposalsDialogOpen(true)}
              />
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по названию или тегам" className="pl-9 h-11" />
                </div>
                <div className="grid grid-cols-1 xs-414:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <CategoryFilter
                    selectedCategories={selectedCategories}
                    onCategoriesChange={setSelectedCategories}
                  />
                  <select value={rating} onChange={e => setRating(e.target.value)} className="h-10 rounded-md border px-3 bg-background text-sm">
                    <option value="">Рейтинг</option>
                    <option value="4.5">4.5+</option>
                    <option value="4.0">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3.0">3.0+</option>
                  </select>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-10 rounded-md border px-3 bg-background text-sm">
                    <option value="">Валюта</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>KZT</option>
                    <option>RUB</option>
                    <option>PLN</option>
                  </select>
                  {activeTab === 'orders' && (
                    <select value={engagement} onChange={e => setEngagement(e.target.value)} className="h-10 rounded-md border px-3 bg-background text-sm">
                      <option value="">Тип занятости</option>
                      <option>Фикс-прайс</option>
                      <option>Почасовая</option>
                    </select>
                  )}
                  <Input type="number" value={min} onChange={e => setMin(e.target.value)} placeholder="Мин. цена" className="h-10" />
                  <Input type="number" value={max} onChange={e => setMax(e.target.value)} placeholder="Макс. цена" className="h-10" />
                  <select value={sort} onChange={e => setSort(e.target.value)} className="h-10 rounded-md border px-3 bg-background text-sm">
                    <option value="new">Новые</option>
                    <option value="priceUp">Цена ↑</option>
                    <option value="priceDown">Цена ↓</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#3F7F6E]">
                    Найдено: {allData.length} | Страница {currentPage} из {totalPages || 1}
                  </div>
                  <Button variant="ghost" size="default" onClick={reset} className="h-9">
                    <X className="h-4 w-4 mr-1" /> Сбросить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#6FE7C8] mx-auto mb-3" />
                <p className="text-[#3F7F6E]">Загрузка...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {data.map((item: any) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => openPreview(item, activeTab === 'orders' ? 'order' : 'task')}>
                    {item.is_boosted && (
                      <BoostBadge isBoosted className="absolute top-3 right-3 z-10" />
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base leading-6 pr-32">{item.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">{item.category}</Badge>
                        {item.subcategory && <Badge variant="outline">{item.subcategory}</Badge>}
                        {activeTab === 'orders' && item.engagement && <Badge variant="outline">{item.engagement}</Badge>}
                        {activeTab === 'tasks' && item.delivery_days && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.delivery_days}д
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 px-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(item.tags || []).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      <div className="text-sm text-[#3F7F6E] line-clamp-2">{item.description}</div>
                    </CardContent>
                    <div className="flex flex-col xs-414:flex-row items-start xs-414:items-center justify-between gap-3 xs-414:gap-0 px-6 py-4 border-t">
                      <div
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer w-full xs-414:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToProfile(item.user_id, user?.id);
                        }}
                      >
                        {profiles[item.user_id]?.avatar_url ? (
                          <img
                            src={optimizeImage(profiles[item.user_id].avatar_url, 28, 85)}
                            alt={profiles[item.user_id].name}
                            className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-[#EFFFF8] flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {profiles[item.user_id]?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium truncate">{profiles[item.user_id]?.name || 'Пользователь'}</span>
                            <StarRating
                              rating={profiles[item.user_id]?.avg_rating || 0}
                              reviewsCount={profiles[item.user_id]?.reviews_count || 0}
                              size="sm"
                              showCount={false}
                            />
                          </div>
                          <ProfileBadges
                            avgRating={profiles[item.user_id]?.avg_rating}
                            reviewsCount={profiles[item.user_id]?.reviews_count}
                            fiveStarCount={profiles[item.user_id]?.five_star_count}
                            createdAt={profiles[item.user_id]?.created_at}
                            showStars={false}
                            compact={true}
                          />
                        </div>
                      </div>
                      {activeTab === 'orders' ? (
                        <PriceDisplay
                          amount={item.price_min}
                          maxAmount={item.price_max}
                          fromCurrency={item.currency}
                          showRange={true}
                        />
                      ) : (
                        <PriceDisplay
                          amount={item.price}
                          fromCurrency={item.currency}
                        />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#3F7F6E]">Ничего не найдено. Попробуйте изменить фильтры.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 px-4">
              <Button
                variant="outline"
                size="default"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10"
              >
                &lt;
              </Button>

              {(() => {
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
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="default"
                    onClick={() => goToPage(page)}
                    className="h-10 w-10"
                  >
                    {page}
                  </Button>
                ));
              })()}

              <Button
                variant="outline"
                size="default"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10"
              >
                &gt;
              </Button>
            </div>
          )}
        </section>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            {previewItem && (
              <>
                {user && previewItem.user_id === user.id && (
                  <div className="bg-gradient-to-r from-[#00FF94] to-[#00D97E] text-black font-semibold text-sm py-2.5 px-4 rounded-lg mb-4 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                      {previewType === 'order' ? 'Ваш заказ' : 'Ваше объявление'}
                    </div>
                  </div>
                )}
                <DialogHeader>
                  <DialogTitle>
                    {previewItem.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary">{previewItem.category}</Badge>
                    {previewItem.subcategory && <Badge variant="outline">{previewItem.subcategory}</Badge>}
                    {previewType === 'order' && previewItem.engagement && <Badge variant="outline">{previewItem.engagement}</Badge>}
                    {previewType === 'task' && previewItem.delivery_days && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {previewItem.delivery_days} дней
                      </Badge>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Описание</div>
                    <p className="text-sm text-[#3F7F6E]">{previewItem.description}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Теги</div>
                    <div className="flex flex-wrap gap-2">
                      {(previewItem.tags || []).map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  {previewType === 'task' && previewItem.features && (
                    <div>
                      <div className="text-sm font-medium mb-2">Что входит</div>
                      <ul className="list-disc list-inside text-sm text-[#3F7F6E]">
                        {previewItem.features.map((f: string) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-3">
                      {profiles[previewItem.user_id]?.avatar_url ? (
                        <img
                          src={optimizeImage(profiles[previewItem.user_id].avatar_url, 40, 85)}
                          alt={profiles[previewItem.user_id].name}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center font-medium">
                          {profiles[previewItem.user_id]?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{profiles[previewItem.user_id]?.name || 'Пользователь'}</div>
                        <div className="text-xs text-[#3F7F6E]">Опубликовано: {new Date(previewItem.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-xl">
                      {previewType === 'order' ? (
                        <PriceDisplay
                          amount={previewItem.price_min}
                          maxAmount={previewItem.price_max}
                          fromCurrency={previewItem.currency}
                          showRange={true}
                        />
                      ) : (
                        <PriceDisplay
                          amount={previewItem.price}
                          fromCurrency={previewItem.currency}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Закрыть</Button>
                  {(!user || previewItem.user_id !== user.id) && (
                    <>
                      {userProposals[`${previewType}-${previewItem.id}`] ? (
                        <Button variant="outline" onClick={() => window.location.hash = '/proposals'}>
                          Ваш отклик
                        </Button>
                      ) : (
                        <Button onClick={handleProposalClick}>
                          Откликнуться
                        </Button>
                      )}
                    </>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={limitExceededDialogOpen} onOpenChange={setLimitExceededDialogOpen}>
          <DialogContent className="max-w-md">
            <div className="flex flex-col items-center text-center py-4">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-xl mb-2">У вас закончились отклики</DialogTitle>
              <DialogDescription className="text-base mb-6">
                Вы израсходовали все доступные отклики. Вы можете приобрести дополнительные отклики или дождаться следующего месяца.
              </DialogDescription>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  className="w-full bg-[#3F7F6E] hover:bg-[#2F6F5E]"
                  onClick={() => {
                    setLimitExceededDialogOpen(false);
                    setBuyProposalsDialogOpen(true);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Приобрести дополнительные отклики
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setLimitExceededDialogOpen(false);
                    setActiveTab('tasks');
                  }}
                >
                  Смотреть задачи фрилансеров
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLimitExceededDialogOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={buyProposalsDialogOpen} onOpenChange={setBuyProposalsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Купить дополнительные отклики</DialogTitle>
              <DialogDescription>
                Ваш баланс: ${userBalance.toFixed(2)} {userCurrency}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {proposalPackages.map((pkg) => {
                const canAfford = userBalance >= pkg.price;
                const pricePerProposal = (pkg.price / pkg.amount).toFixed(2);

                return (
                  <div
                    key={pkg.amount}
                    onClick={() => canAfford && setSelectedPackage(pkg)}
                    className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPackage?.amount === pkg.amount
                        ? 'border-[#3F7F6E] bg-[#EFFFF8]'
                        : canAfford
                        ? 'border-gray-200 hover:border-[#3F7F6E] hover:bg-[#EFFFF8]'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {pkg.amount === 100 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6FE7C8] text-white text-xs font-bold px-3 py-1 rounded-full">
                        ПОПУЛЯРНЫЙ
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#3F7F6E] mb-2">
                        {pkg.amount}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">откликов</div>
                      <div className="text-3xl font-bold mb-2">
                        ${pkg.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${pricePerProposal} за отклик
                      </div>
                      {!canAfford && (
                        <div className="mt-3 text-xs text-red-600 font-medium">
                          Недостаточно средств
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBuyProposalsDialogOpen(false);
                  setSelectedPackage(null);
                }}
                disabled={purchasing}
              >
                Отмена
              </Button>
              <Button
                onClick={handlePurchaseProposals}
                disabled={!selectedPackage || purchasing}
                className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Купить {selectedPackage?.amount || 0} откликов
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
