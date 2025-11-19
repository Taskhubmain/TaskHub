import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Package,
  ListTodo,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PriceDisplay from '@/components/PriceDisplay';
import ProfileBadges from '@/components/ui/ProfileBadges';
import StarRating from '@/components/ui/StarRating';
import OpenDisputeDialog from '@/components/OpenDisputeDialog';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { navigateToProfile } from '@/lib/navigation';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

type Tab = 'orders' | 'tasks' | 'mywork';

interface Proposal {
  id: string;
  user_id: string;
  message: string;
  price: number;
  currency: string;
  delivery_days: number;
  status: string;
  created_at: string;
  profile?: {
    name: string;
    avatar_url: string | null;
    avg_rating?: number;
    reviews_count?: number;
    five_star_count?: number;
    created_at?: string;
  };
}

interface Order {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number;
  price_max: number;
  currency: string;
  deadline: string;
  status: string;
  views_count: number;
  created_at: string;
  hasActiveDeal?: boolean;
  activeDeal?: {
    id: string;
    order_id: string;
    task_id: string | null;
    status: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  delivery_days: number;
  status: string;
  views_count: number;
  created_at: string;
  hasActiveDeal?: boolean;
  activeDeal?: {
    id: string;
    order_id: string | null;
    task_id: string;
    status: string;
  };
}

export default function MyDealsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [proposalOptions, setProposalOptions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [disputeDialog, setDisputeDialog] = useState<{
    open: boolean;
    dealId?: string;
    orderId?: string;
    taskId?: string;
  }>({ open: false });

  useEffect(() => {
    if (user) {
      localStorage.setItem(`viewed_deals_${user.id}`, JSON.stringify({ timestamp: Date.now() }));
    }
  }, [user]);

  useEffect(() => {
    loadDeals();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel('proposals_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProposal = payload.new as any;
            const orderId = newProposal.order_id;
            const taskId = newProposal.task_id;

            const { data: profileData } = await getSupabase()
              .from('profiles')
              .select('id, name, avatar_url, avg_rating, reviews_count, five_star_count, created_at')
              .eq('id', newProposal.user_id)
              .maybeSingle();

            const enrichedProposal = {
              ...newProposal,
              profile: profileData
            };

            const itemId = orderId || taskId;
            setProposals((prev) => ({
              ...prev,
              [itemId]: [enrichedProposal, ...(prev[itemId] || [])]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedProposal = payload.new as any;
            const itemId = updatedProposal.order_id || updatedProposal.task_id;

            setProposals((prev) => {
              if (!prev[itemId]) return prev;
              return {
                ...prev,
                [itemId]: prev[itemId].map((p) =>
                  p.id === updatedProposal.id ? { ...p, ...updatedProposal } : p
                )
              };
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setProposals((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((itemId) => {
                updated[itemId] = updated[itemId]?.filter((p: any) => p.id !== deletedId) || [];
              });
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const {
        data: { user: authUser }
      } = await getSupabase().auth.getUser();
      if (!authUser) return;

      if (activeTab === 'mywork') {
        const { data: dealsData } = await getSupabase()
          .from('deals')
          .select('*')
          .or(`freelancer_id.eq.${authUser.id},client_id.eq.${authUser.id}`)
          .order('created_at', { ascending: false });

        const clientIds = Array.from(new Set((dealsData || []).map((d) => d.client_id)));
        const freelancerIds = Array.from(new Set((dealsData || []).map((d) => d.freelancer_id)));
        const allUserIds = Array.from(new Set([...clientIds, ...freelancerIds]));

        let profilesMap: any = {};
        if (allUserIds.length > 0) {
          const { data: profilesData } = await getSupabase()
            .from('profiles')
            .select('id, name, avatar_url, avg_rating, reviews_count, five_star_count, created_at')
            .in('id', allUserIds);
          profilesMap = Object.fromEntries((profilesData || []).map((p) => [p.id, p]));
        }

        setDeals(
          (dealsData || []).map((d) => ({
            ...d,
            client: profilesMap[d.client_id],
            freelancer: profilesMap[d.freelancer_id],
            isMyOrder: d.client_id === authUser.id
          }))
        );
      } else {
        const { data: ordersData } = await getSupabase()
          .from('orders')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: tasksData } = await getSupabase()
          .from('tasks')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: activeDeals } = await getSupabase()
          .from('deals')
          .select('order_id, task_id, id, status')
          .neq('status', 'completed');

        const ordersDealsMap = Object.fromEntries(
          (activeDeals || []).filter((d) => d.order_id).map((d) => [d.order_id, d])
        );
        const tasksDealsMap = Object.fromEntries(
          (activeDeals || []).filter((d) => d.task_id).map((d) => [d.task_id, d])
        );

        const enrichedOrders = (ordersData || []).map((o) => ({
          ...o,
          hasActiveDeal: !!ordersDealsMap[o.id],
          activeDeal: ordersDealsMap[o.id]
        }));

        const enrichedTasks = (tasksData || []).map((t) => ({
          ...t,
          hasActiveDeal: !!tasksDealsMap[t.id],
          activeDeal: tasksDealsMap[t.id]
        }));

        setOrders(enrichedOrders);
        setTasks(enrichedTasks);

        const orderIds = (ordersData || []).map((o) => o.id);
        const taskIds = (tasksData || []).map((t) => t.id);
        const allIds = [...orderIds, ...taskIds];

        if (allIds.length > 0) {
          const { data: allProposalsData } = await getSupabase()
            .from('proposals')
            .select('*')
            .or(
              orderIds.length > 0 && taskIds.length > 0
                ? `order_id.in.(${orderIds.join(',')}),task_id.in.(${taskIds.join(',')})`
                : orderIds.length > 0
                ? `order_id.in.(${orderIds.join(',')})`
                : `task_id.in.(${taskIds.join(',')})`
            )
            .order('created_at', { ascending: false });

          if (allProposalsData && allProposalsData.length > 0) {
            const userIds = Array.from(new Set(allProposalsData.map((p) => p.user_id)));
            const { data: profilesData } = await getSupabase()
              .from('profiles')
              .select('id, name, avatar_url, avg_rating, reviews_count, five_star_count, created_at')
              .in('id', userIds);

            const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

            const proposalsByItem: Record<string, Proposal[]> = {};

            allProposalsData.forEach((p) => {
              const itemId = p.order_id || p.task_id;
              if (!proposalsByItem[itemId]) {
                proposalsByItem[itemId] = [];
              }
              proposalsByItem[itemId].push({
                ...p,
                profile: profilesMap.get(p.user_id)
              });
            });

            setProposals(proposalsByItem);

            const allProposalIds = allProposalsData.map((p) => p.id);
            const { data: optionsData } = await getSupabase()
              .from('proposal_options')
              .select('*')
              .in('proposal_id', allProposalIds)
              .order('order_index', { ascending: true });

            if (optionsData) {
              const optionsByProposal: Record<string, any[]> = {};
              optionsData.forEach((opt) => {
                if (!optionsByProposal[opt.proposal_id]) {
                  optionsByProposal[opt.proposal_id] = [];
                }
                optionsByProposal[opt.proposal_id].push(opt);
              });
              setProposalOptions(optionsByProposal);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (itemId: string, _type: 'order' | 'task') => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  const handlePauseResume = async (
    itemId: string,
    currentStatus: string,
    type: 'order' | 'task'
  ) => {
    const isPausing = currentStatus === 'open' || currentStatus === 'active';

    const newStatus = isPausing ? 'paused' : type === 'order' ? 'open' : 'active';

    const table = type === 'order' ? 'orders' : 'tasks';
    const { error } = await getSupabase().from(table).update({ status: newStatus }).eq('id', itemId);

    if (!error) {
      loadDeals();
    }
  };

  const handleDelete = async (itemId: string, type: 'order' | 'task') => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить это ${
          type === 'order' ? 'заказ' : 'объявление'
        }?`
      )
    ) {
      return;
    }

    const table = type === 'order' ? 'orders' : 'tasks';
    const { error } = await getSupabase().from(table).delete().eq('id', itemId);

    if (!error) {
      loadDeals();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'outline' | 'warning' }
    > = {
      open: { label: 'Открыт', variant: 'default' },
      active: { label: 'Активно', variant: 'default' },
      paused: { label: 'Приостановлено', variant: 'warning' },
      closed: { label: 'Закрыт', variant: 'outline' }
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-7xl px-3 xs-375:px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Мои сделки</h1>

        <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('orders')}
            className={`relative px-3 xs-375:px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'orders'
                ? 'text-[#6FE7C8]'
                : 'text-[#3F7F6E] hover:text-[#6FE7C8]'
            }`}
          >
            <Package className="inline-block h-4 w-4 mr-1 xs-375:mr-2" />
            <span className="hidden xs-375:inline">
              Мои заказы ({orders.length})
            </span>
            <span className="xs-375:hidden">Заказы ({orders.length})</span>
            {activeTab === 'orders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FE7C8]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`relative px-3 xs-375:px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'tasks'
                ? 'text-[#6FE7C8]'
                : 'text-[#3F7F6E] hover:text-[#6FE7C8]'
            }`}
          >
            <ListTodo className="inline-block h-4 w-4 mr-1 xs-375:mr-2" />
            <span className="hidden xs-375:inline">
              Мои объявления ({tasks.length})
            </span>
            <span className="xs-375:hidden">Объявления ({tasks.length})</span>
            {activeTab === 'tasks' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FE7C8]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mywork')}
            className={`relative px-3 xs-375:px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'mywork'
                ? 'text-[#6FE7C8]'
                : 'text-[#3F7F6E] hover:text-[#6FE7C8]'
            }`}
          >
            <Briefcase className="inline-block h-4 w-4 mr-1 xs-375:mr-2" />
            <span className="hidden xs-375:inline">
              Моя работа ({deals.length})
            </span>
            <span className="xs-375:hidden">Работа ({deals.length})</span>
            {activeTab === 'mywork' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6FE7C8]" />
            )}
          </button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#6FE7C8] mx-auto mb-3" />
              <p className="text-[#3F7F6E]">Загрузка...</p>
            </CardContent>
          </Card>
        ) : activeTab === 'orders' ? (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button asChild>
                <a href="#/order/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать заказ
                </a>
              </Button>
            </div>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-[#3F7F6E]" />
                  <p className="text-[#3F7F6E] mb-4">У вас пока нет заказов</p>
                  <Button asChild>
                    <a href="#/order/new">Создать первый заказ</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 xs-375:p-4 sm:p-6">
                    {/* MOBILE VERSION */}
                    <div className="sm:hidden">
                      <div className="mb-3">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <a
                            href={`#/order/${order.id}`}
                            className="text-base xs-375:text-lg font-semibold hover:text-[#6FE7C8] transition-colors flex-1 min-w-0"
                          >
                            {order.title}
                          </a>
                          {/* mobile has only small action bar below, здесь пусто */}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{order.category}</Badge>
                          {getStatusBadge(order.status)}
                          {order.hasActiveDeal && (
                            <Badge className="bg-[#6FE7C8] text-white hover:bg-[#5DD6B7]">
                              В работе
                            </Badge>
                          )}
                        </div>
                        <div className="sm:hidden flex gap-2 mt-2">
                          {!order.hasActiveDeal ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1"
                              >
                                <a href={`#/order/${order.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePauseResume(order.id, order.status, 'order')
                                }
                                className="flex-1"
                              >
                                {order.status === 'paused' ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(order.id, 'order')}
                                className="flex-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-[#3F7F6E] mb-4 line-clamp-2 text-sm xs-375:text-base">
                        {order.description}
                      </p>
                      <div className="flex flex-col xs-375:flex-row xs-375:justify-between xs-375:items-center gap-2 xs-375:gap-4 text-sm xs-375:text-base mb-3">
                        <div className="flex gap-4 xs-375:gap-5">
                          <div className="flex items-center gap-1.5 text-[#3F7F6E]">
                            <Eye className="h-4 w-4 xs-375:h-5 xs-375:w-5" />
                            <span className="font-medium">{order.views_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#3F7F6E]">
                            <MessageSquare className="h-4 w-4 xs-375:h-5 xs-375:w-5" />
                            <span className="font-medium">
                              {proposals[order.id]?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-[#3F7F6E] flex items-center gap-1.5">
                          <span className="hidden xs-375:inline">Бюджет:</span>
                          <span className="font-semibold text-foreground text-base xs-375:text-lg">
                            <PriceDisplay
                              amount={order.price_min}
                              maxAmount={order.price_max}
                              fromCurrency={order.currency}
                              showRange={true}
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DESKTOP VERSION */}
                    <div className="hidden sm:block">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <a
                              href={`#/order/${order.id}`}
                              className="text-lg font-semibold hover:text-[#6FE7C8] transition-colors truncate"
                            >
                              {order.title}
                            </a>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary">{order.category}</Badge>
                            {getStatusBadge(order.status)}
                            {order.hasActiveDeal && (
                              <Badge className="bg-[#6FE7C8] text-white hover:bg-[#5DD6B7]">
                                В работе
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#3F7F6E] text-sm mb-3 line-clamp-2">
                            {order.description}
                          </p>
                          <div className="flex items-center flex-wrap gap-5 text-sm text-[#3F7F6E]">
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">
                                {order.views_count || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4" />
                              <span className="font-medium">
                                {proposals[order.id]?.length || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Бюджет:</span>
                              <span className="font-semibold text-foreground">
                                <PriceDisplay
                                  amount={order.price_min}
                                  maxAmount={order.price_max}
                                  fromCurrency={order.currency}
                                  showRange={true}
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {!order.hasActiveDeal ? (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`#/order/${order.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Редактировать
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePauseResume(order.id, order.status, 'order')
                                }
                              >
                                {order.status === 'paused' ? (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Возобновить
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Пауза
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(order.id, 'order')}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* TOGGLE + PROPOSALS (общие для обеих версий) */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(order.id, 'order')}
                      className="w-full mt-2"
                    >
                      {expandedItem === order.id ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Скрыть отклики
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Показать отклики (
                          {proposals[order.id]?.length || 0})
                        </>
                      )}
                    </Button>
                    <AnimatePresence>
                      {expandedItem === order.id && proposals[order.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="mt-4 space-y-3 border-t pt-4 overflow-hidden"
                        >
                          {proposals[order.id].length === 0 ? (
                            <p className="text-sm text-[#3F7F6E] text-center">
                              Откликов пока нет
                            </p>
                          ) : (
                            proposals[order.id].map((proposal) => (
                              <Card key={proposal.id}>
                                <CardContent className="p-3 xs-375:p-4">
                                  <div className="mb-2">
                                    <div className="flex flex-col xs-414:flex-row xs-414:justify-between xs-414:items-start gap-2 mb-2">
                                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="font-medium flex items-center gap-1.5 text-sm xs-375:text-base">
                                            <span className="truncate">
                                              {proposal.profile?.name ||
                                                'Пользователь'}
                                            </span>
                                            <StarRating
                                              rating={
                                                proposal.profile?.avg_rating || 0
                                              }
                                              reviewsCount={
                                                proposal.profile?.reviews_count ||
                                                0
                                              }
                                              size="sm"
                                              showCount={false}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            <PriceDisplay
                                              amount={proposal.price}
                                              fromCurrency={proposal.currency}
                                            />
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {proposal.delivery_days} дней
                                          </Badge>
                                        </div>
                                        <ProfileBadges
                                          avgRating={
                                            proposal.profile?.avg_rating
                                          }
                                          reviewsCount={
                                            proposal.profile?.reviews_count
                                          }
                                          fiveStarCount={
                                            proposal.profile?.five_star_count
                                          }
                                          createdAt={
                                            proposal.profile?.created_at
                                          }
                                          showStars={false}
                                          compact={true}
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 xs-414:flex-col xs-414:items-end">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            (window.location.hash = '/proposals')
                                          }
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                        <div className="text-xs text-[#3F7F6E] whitespace-nowrap">
                                          {new Date(
                                            proposal.created_at
                                          ).toLocaleDateString('ru-RU')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs xs-375:text-sm text-[#3F7F6E]">
                                    {proposal.message}
                                  </p>
                                  {proposalOptions[proposal.id] &&
                                    proposalOptions[proposal.id].length > 0 && (
                                      <div className="mt-3 pt-3 border-t space-y-2">
                                        <div className="text-xs font-medium text-[#3F7F6E]">
                                          Опции:
                                        </div>
                                        {proposalOptions[proposal.id].map(
                                          (option) => (
                                            <div
                                              key={option.id}
                                              className="text-xs bg-[#EFFFF8] p-2 rounded"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">
                                                  {option.title}
                                                </span>
                                                <div className="flex gap-1">
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    <PriceDisplay
                                                      amount={option.price}
                                                      fromCurrency={
                                                        proposal.currency
                                                      }
                                                    />
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {option.delivery_days} дней
                                                  </Badge>
                                                </div>
                                              </div>
                                              {option.description && (
                                                <p className="text-[#3F7F6E]">
                                                  {option.description}
                                                </p>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button asChild>
                <a href="#/task/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать объявление
                </a>
              </Button>
            </div>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 text-[#3F7F6E]" />
                  <p className="text-[#3F7F6E] mb-4">
                    У вас пока нет объявлений
                  </p>
                  <Button asChild>
                    <a href="#/task/new">Создать первое объявление</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 xs-375:p-4 sm:p-6">
                    {/* MOBILE VERSION */}
                    <div className="sm:hidden">
                      <div className="mb-3">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <a
                            href={`#/task/${task.id}`}
                            className="text-base xs-375:text-lg font-semibold hover:text-[#6FE7C8] transition-colors flex-1 min-w-0"
                          >
                            {task.title}
                          </a>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{task.category}</Badge>
                          {getStatusBadge(task.status)}
                          {task.hasActiveDeal && (
                            <Badge className="bg-[#6FE7C8] text-white hover:bg-[#5DD6B7]">
                              В работе
                            </Badge>
                          )}
                        </div>
                        <div className="sm:hidden flex gap-2 mt-2">
                          {!task.hasActiveDeal ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1"
                              >
                                <a href={`#/task/${task.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePauseResume(task.id, task.status, 'task')
                                }
                                className="flex-1"
                              >
                                {task.status === 'paused' ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(task.id, 'task')}
                                className="flex-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-[#3F7F6E] mb-4 line-clamp-2 text-sm xs-375:text-base">
                        {task.description}
                      </p>
                      <div className="flex flex-col xs-375:flex-row xs-375:justify-between xs-375:items-center gap-2 xs-375:gap-4 text-sm xs-375:text-base mb-3">
                        <div className="flex gap-4 xs-375:gap-5">
                          <div className="flex items-center gap-1.5 text-[#3F7F6E]">
                            <Eye className="h-4 w-4 xs-375:h-5 xs-375:w-5" />
                            <span className="font-medium">{task.views_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#3F7F6E]">
                            <MessageSquare className="h-4 w-4 xs-375:h-5 xs-375:w-5" />
                            <span className="font-medium">
                              {proposals[task.id]?.length || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-[#3F7F6E] flex items-center gap-1.5">
                          <span className="hidden xs-375:inline">Цена:</span>
                          <span className="font-semibold text-foreground text-base xs-375:text-lg">
                            <PriceDisplay
                              amount={task.price}
                              fromCurrency={task.currency}
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DESKTOP VERSION */}
                    <div className="hidden sm:block">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <a
                              href={`#/task/${task.id}`}
                              className="text-lg font-semibold hover:text-[#6FE7C8] transition-colors truncate"
                            >
                              {task.title}
                            </a>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary">{task.category}</Badge>
                            {getStatusBadge(task.status)}
                            {task.hasActiveDeal && (
                              <Badge className="bg-[#6FE7C8] text-white hover:bg-[#5DD6B7]">
                                В работе
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#3F7F6E] text-sm mb-3 line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center flex-wrap gap-5 text-sm text-[#3F7F6E]">
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">
                                {task.views_count || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4" />
                              <span className="font-medium">
                                {proposals[task.id]?.length || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Цена:</span>
                              <span className="font-semibold text-foreground">
                                <PriceDisplay
                                  amount={task.price}
                                  fromCurrency={task.currency}
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {!task.hasActiveDeal ? (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`#/task/${task.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Редактировать
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePauseResume(task.id, task.status, 'task')
                                }
                              >
                                {task.status === 'paused' ? (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Возобновить
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Пауза
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(task.id, 'task')}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* TOGGLE + PROPOSALS */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(task.id, 'task')}
                      className="w-full mt-2"
                    >
                      {expandedItem === task.id ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Скрыть заказы
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Показать заказы (
                          {proposals[task.id]?.length || 0})
                        </>
                      )}
                    </Button>
                    <AnimatePresence>
                      {expandedItem === task.id && proposals[task.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="mt-4 space-y-3 border-t pt-4 overflow-hidden"
                        >
                          {proposals[task.id].length === 0 ? (
                            <p className="text-sm text-[#3F7F6E] text-center">
                              Заказов пока нет
                            </p>
                          ) : (
                            proposals[task.id].map((proposal) => (
                              <Card key={proposal.id}>
                                <CardContent className="p-3 xs-375:p-4">
                                  <div className="mb-2">
                                    <div className="flex flex-col xs-414:flex-row xs-414:justify-between xs-414:items-start gap-2 mb-2">
                                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="font-medium flex items-center gap-1.5 text-sm xs-375:text-base">
                                            <span className="truncate">
                                              {proposal.profile?.name ||
                                                'Пользователь'}
                                            </span>
                                            <StarRating
                                              rating={
                                                proposal.profile?.avg_rating || 0
                                              }
                                              reviewsCount={
                                                proposal.profile?.reviews_count ||
                                                0
                                              }
                                              size="sm"
                                              showCount={false}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            <PriceDisplay
                                              amount={proposal.price}
                                              fromCurrency={proposal.currency}
                                            />
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {proposal.delivery_days} дней
                                          </Badge>
                                        </div>
                                        <ProfileBadges
                                          avgRating={
                                            proposal.profile?.avg_rating
                                          }
                                          reviewsCount={
                                            proposal.profile?.reviews_count
                                          }
                                          fiveStarCount={
                                            proposal.profile?.five_star_count
                                          }
                                          createdAt={
                                            proposal.profile?.created_at
                                          }
                                          showStars={false}
                                          compact={true}
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 xs-414:flex-col xs-414:items-end">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            (window.location.hash = '/proposals')
                                          }
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                        <div className="text-xs text-[#3F7F6E] whitespace-nowrap">
                                          {new Date(
                                            proposal.created_at
                                          ).toLocaleDateString('ru-RU')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs xs-375:text-sm text-[#3F7F6E]">
                                    {proposal.message}
                                  </p>
                                  {proposalOptions[proposal.id] &&
                                    proposalOptions[proposal.id].length > 0 && (
                                      <div className="mt-3 pt-3 border-t space-y-2">
                                        <div className="text-xs font-medium text-[#3F7F6E]">
                                          Опции:
                                        </div>
                                        {proposalOptions[proposal.id].map(
                                          (option) => (
                                            <div
                                              key={option.id}
                                              className="text-xs bg-[#EFFFF8] p-2 rounded"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">
                                                  {option.title}
                                                </span>
                                                <div className="flex gap-1">
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    <PriceDisplay
                                                      amount={option.price}
                                                      fromCurrency={
                                                        proposal.currency
                                                      }
                                                    />
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {option.delivery_days} дней
                                                  </Badge>
                                                </div>
                                              </div>
                                              {option.description && (
                                                <p className="text-[#3F7F6E]">
                                                  {option.description}
                                                </p>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : activeTab === 'mywork' ? (
          <div className="space-y-4">
            {deals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 text-[#3F7F6E]" />
                  <p className="text-[#3F7F6E] mb-4">
                    У вас пока нет активных сделок
                  </p>
                </CardContent>
              </Card>
            ) : (
              deals.map((deal) => (
                <Card
                  key={deal.id}
                  className="hover:shadow-lg transition-shadow relative overflow-hidden"
                >
                  {deal.isMyOrder && (
                    <div
                      className="absolute top-0 right-0 bg-gradient-to-l from-[#6FE7C8] to-[#4ECDB0] text-white px-4 xs-375:px-6 py-1 text-[10px] xs-375:text-xs font-semibold shadow-md"
                      style={{
                        clipPath:
                          'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)'
                      }}
                    >
                      {deal.order_id ? 'Ваш заказ' : 'Ваше объявление'}
                    </div>
                  )}
                  {!deal.isMyOrder && (
                    <div
                      className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-blue-400 text-white px-4 xs-375:px-6 py-1 text-[10px] xs-375:text-xs font-semibold shadow-md"
                      style={{
                        clipPath:
                          'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)'
                      }}
                    >
                      {deal.order_id ? 'Принятый заказ' : 'Принятое объявление'}
                    </div>
                  )}
                  <CardContent className="p-3 xs-375:p-4 sm:p-6 pt-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-2">
                          <h3 className="text-base xs-375:text-lg font-semibold">
                            {deal.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">
                            {deal.currency} {deal.price}
                          </Badge>
                          <Badge variant="outline">
                            {deal.delivery_days} дней
                          </Badge>
                          <Badge
                            className={
                              deal.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : deal.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : deal.status === 'disputed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {deal.status === 'in_progress'
                              ? 'В работе'
                              : deal.status === 'completed'
                              ? 'Завершено'
                              : deal.status === 'disputed'
                              ? 'Спор'
                              : deal.status}
                          </Badge>
                        </div>
                        {deal.chat_id && (
                          <div className="hidden sm:flex mb-3">
                            <Button
                              variant="default"
                              size="default"
                              onClick={() =>
                                (window.location.hash = `/messages?chat=${deal.chat_id}`)
                              }
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Перейти
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mb-3 pt-3 border-t">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
                            onClick={() =>
                              navigateToProfile(deal.client_id, user?.id)
                            }
                          >
                            {deal.client?.avatar_url ? (
                              <img
                                src={deal.client.avatar_url}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {deal.client?.name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium">
                              Заказчик:{' '}
                              {deal.client?.name || 'Пользователь'}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition"
                            onClick={() =>
                              navigateToProfile(deal.freelancer_id, user?.id)
                            }
                          >
                            {deal.freelancer?.avatar_url ? (
                              <img
                                src={deal.freelancer.avatar_url}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {deal.freelancer?.name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium">
                              Исполнитель:{' '}
                              {deal.freelancer?.name || 'Пользователь'}
                            </span>
                          </div>
                        </div>
                        {deal.description && (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-[#3F7F6E] mb-3 line-clamp-2">
                              {deal.description}
                            </p>
                          </div>
                        )}
                        <div className="text-xs text-[#3F7F6E] pt-2 border-t">
                          Создано:{' '}
                          {new Date(deal.created_at).toLocaleDateString(
                            'ru-RU'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="sm:hidden flex flex-col gap-2 mt-3 pt-3 border-t -mx-3 xs-375:-mx-4 px-3 xs-375:px-4 bg-gray-50">
                      {deal.chat_id && (
                        <Button
                          variant="default"
                          size="default"
                          onClick={() =>
                            (window.location.hash = `/messages?chat=${deal.chat_id}`)
                          }
                          className="w-full"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Перейти
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : null}
      </section>

      <OpenDisputeDialog
        open={disputeDialog.open}
        onOpenChange={(open) => setDisputeDialog({ ...disputeDialog, open })}
        dealId={disputeDialog.dealId || ''}
        orderId={disputeDialog.orderId}
        taskId={disputeDialog.taskId}
        userId={user?.id || ''}
        onSuccess={() => {
          loadData();
        }}
      />
    </motion.div>
  );
}
