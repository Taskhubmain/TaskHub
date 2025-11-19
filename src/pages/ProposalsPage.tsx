import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, X, FileText, Loader2, User, Award, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProfileBadges from '@/components/ui/ProfileBadges';
import StarRating from '@/components/ui/StarRating';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { navigateToProfile } from '@/lib/navigation';
import { optimizeImage } from '@/lib/image-optimization';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function ProposalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [sentProposals, setSentProposals] = useState<any[]>([]);
  const [receivedProposals, setReceivedProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<Record<string, any>>({});
  const [tasks, setTasks] = useState<Record<string, any>>({});
  const [proposalOptions, setProposalOptions] = useState<Record<string, any[]>>({});
  const [acceptingProposal, setAcceptingProposal] = useState<string | null>(null);
  const [insufficientBalanceDialog, setInsufficientBalanceDialog] = useState<{
    open: boolean;
    required: number;
    available: number;
    currency: string;
  }>({ open: false, required: 0, available: 0, currency: 'USD' });

  useEffect(() => {
    if (user) {
      localStorage.setItem(`viewed_proposals_${user.id}`, JSON.stringify({ timestamp: Date.now() }));
    }
    loadProposals();

    if (!user) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel('proposals_changes')
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

            if (newProposal.user_id === user.id) {
              setSentProposals(prev => [newProposal, ...prev]);
            }

            const orderIds = await getUserOrderIds();
            const taskIds = await getUserTaskIds();
            const isForMyOrder = newProposal.order_id && orderIds.includes(newProposal.order_id);
            const isForMyTask = newProposal.task_id && taskIds.includes(newProposal.task_id);

            if (isForMyOrder || isForMyTask) {
              setReceivedProposals(prev => [newProposal, ...prev]);
            }

            if (!profiles[newProposal.user_id]) {
              const { data: profileData } = await getSupabase()
                .from('profiles')
                .select('id, name, avatar_url, avg_rating, reviews_count, five_star_count, created_at')
                .eq('id', newProposal.user_id)
                .single();
              if (profileData) {
                setProfiles(prev => ({ ...prev, [profileData.id]: profileData }));
              }
            }

            if (newProposal.order_id && !orders[newProposal.order_id]) {
              const { data: orderData } = await getSupabase()
                .from('orders')
                .select('id, title, user_id')
                .eq('id', newProposal.order_id)
                .single();
              if (orderData) {
                setOrders(prev => ({ ...prev, [orderData.id]: orderData }));
              }
            }

            if (newProposal.task_id && !tasks[newProposal.task_id]) {
              const { data: taskData } = await getSupabase()
                .from('tasks')
                .select('id, title, user_id')
                .eq('id', newProposal.task_id)
                .single();
              if (taskData) {
                setTasks(prev => ({ ...prev, [taskData.id]: taskData }));
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedProposal = payload.new as any;
            setSentProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
            setReceivedProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setSentProposals(prev => prev.filter(p => p.id !== deletedId));
            setReceivedProposals(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadProposals = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const supabase = getSupabase();

      const { data: sent } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'withdrawn'])
        .order('created_at', { ascending: false });

      const orderIds = await getUserOrderIds();
      const taskIds = await getUserTaskIds();

      let received: any[] = [];

      if (orderIds.length > 0 || taskIds.length > 0) {
        const conditions: string[] = [];
        if (orderIds.length > 0) conditions.push(`order_id.in.(${orderIds.join(',')})`);
        if (taskIds.length > 0) conditions.push(`task_id.in.(${taskIds.join(',')})`);

        const { data: receivedData } = await supabase
          .from('proposals')
          .select('*')
          .or(conditions.join(','))
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        received = receivedData || [];
      }

      setSentProposals(sent || []);
      setReceivedProposals(received);

      const allUserIds = new Set<string>();
      (sent || []).forEach((p: any) => allUserIds.add(p.user_id));
      (received || []).forEach((p: any) => allUserIds.add(p.user_id));

      const allOrderIds = new Set<string>();
      const allTaskIds = new Set<string>();
      (sent || []).forEach((p: any) => {
        if (p.order_id) allOrderIds.add(p.order_id);
        if (p.task_id) allTaskIds.add(p.task_id);
      });
      (received || []).forEach((p: any) => {
        if (p.order_id) allOrderIds.add(p.order_id);
        if (p.task_id) allTaskIds.add(p.task_id);
      });

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

      if (allOrderIds.size > 0) {
        const { data: ordersData } = await getSupabase()
          .from('orders')
          .select('id, title, user_id')
          .in('id', Array.from(allOrderIds));

        const ordersMap: Record<string, any> = {};
        (ordersData || []).forEach((o: any) => {
          ordersMap[o.id] = o;
        });
        setOrders(ordersMap);
      }

      if (allTaskIds.size > 0) {
        const { data: tasksData } = await getSupabase()
          .from('tasks')
          .select('id, title, user_id')
          .in('id', Array.from(allTaskIds));

        const tasksMap: Record<string, any> = {};
        (tasksData || []).forEach((t: any) => {
          tasksMap[t.id] = t;
        });
        setTasks(tasksMap);
      }

      const allProposalIds = [...(sent || []), ...(received || [])].map(p => p.id);
      if (allProposalIds.length > 0) {
        const { data: optionsData } = await getSupabase()
          .from('proposal_options')
          .select('*')
          .in('proposal_id', allProposalIds)
          .order('order_index', { ascending: true });

        if (optionsData) {
          const optionsByProposal: Record<string, any[]> = {};
          optionsData.forEach(opt => {
            if (!optionsByProposal[opt.proposal_id]) {
              optionsByProposal[opt.proposal_id] = [];
            }
            optionsByProposal[opt.proposal_id].push(opt);
          });
          setProposalOptions(optionsByProposal);
        }
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserOrderIds = async () => {
    if (!user) return [];
    const { data } = await getSupabase()
      .from('orders')
      .select('id')
      .eq('user_id', user.id);
    return (data || []).map((o: any) => o.id);
  };

  const getUserTaskIds = async () => {
    if (!user) return [];
    const { data } = await getSupabase()
      .from('tasks')
      .select('id')
      .eq('user_id', user.id);
    return (data || []).map((t: any) => t.id);
  };

  const handleAccept = async (proposal: any) => {
    if (!user || acceptingProposal) return;

    setAcceptingProposal(proposal.id);

    try {
      const supabase = getSupabase();

      const item = proposal.order_id ? orders[proposal.order_id] : tasks[proposal.task_id];

      if (!item) {
        throw new Error('Заказ или задача не найдены');
      }

      const clientId = item.user_id;
      const freelancerId = proposal.user_id;

      // Проверяем, есть ли уже сделка по этому заказу/задаче
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .eq(proposal.order_id ? 'order_id' : 'task_id', proposal.order_id || proposal.task_id)
        .maybeSingle();

      if (existingDeal) {
        alert('Сделка по этому заказу уже существует');
        setAcceptingProposal(null);
        return;
      }

      // Получаем все чаты между этими пользователями
      const { data: allChats } = await supabase
        .from('chats')
        .select('id')
        .or(`and(participant1_id.eq.${clientId},participant2_id.eq.${freelancerId}),and(participant1_id.eq.${freelancerId},participant2_id.eq.${clientId})`);

      // Получаем ID чатов, которые используются в сделках
      const { data: dealChats } = await supabase
        .from('deals')
        .select('chat_id')
        .or(`and(client_id.eq.${clientId},freelancer_id.eq.${freelancerId}),and(client_id.eq.${freelancerId},freelancer_id.eq.${clientId})`);

      const dealChatIds = new Set((dealChats || []).map(d => d.chat_id));

      // Находим общий чат (не используется в сделках)
      const existingGeneralChat = (allChats || []).find(chat => !dealChatIds.has(chat.id));

      let generalChatId;
      if (existingGeneralChat) {
        generalChatId = existingGeneralChat.id;
      } else {
        // Создаем общий чат, если его нет
        const { data: newGeneralChat, error: generalChatError } = await supabase
          .from('chats')
          .insert({
            participant1_id: clientId,
            participant2_id: freelancerId
          })
          .select()
          .single();

        if (generalChatError) {
          console.error('General chat creation error:', generalChatError);
          throw generalChatError;
        }

        generalChatId = newGeneralChat.id;
      }

      // Создаем отдельный чат для сделки
      const { data: newDealChat, error: dealChatError } = await supabase
        .from('chats')
        .insert({
          participant1_id: clientId,
          participant2_id: freelancerId
        })
        .select()
        .single();

      if (dealChatError) {
        console.error('Deal chat creation error:', dealChatError);
        throw dealChatError;
      }

      // Проверяем баланс клиента
      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, name')
        .eq('id', clientId)
        .maybeSingle();

      if (profileError) throw profileError;

      const clientBalance = clientProfile?.balance || 0;
      const requiredAmount = proposal.price;

      if (clientBalance < requiredAmount) {
        setInsufficientBalanceDialog({
          open: true,
          required: requiredAmount,
          available: clientBalance,
          currency: proposal.currency
        });

        setAcceptingProposal(null);
        return;
      }

      const dealData = {
        proposal_id: proposal.id,
        order_id: proposal.order_id || null,
        task_id: proposal.task_id || null,
        client_id: clientId,
        freelancer_id: freelancerId,
        chat_id: newDealChat.id,
        title: item.title,
        description: proposal.message || '',
        price: proposal.price,
        currency: proposal.currency,
        delivery_days: proposal.delivery_days,
        status: 'in_progress'
      };

      const { data: createdDeal, error: dealError } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();

      if (dealError) {
        console.error('Deal creation error:', dealError);
        throw dealError;
      }

      // Блокируем средства в эскроу
      const priceInMinorUnits = Math.round(proposal.price * 100);
      const { data: escrowResult, error: escrowError } = await supabase
        .rpc('lock_funds_in_escrow', {
          p_deal_id: createdDeal.id,
          p_client_id: clientId,
          p_amount_minor: priceInMinorUnits,
          p_currency: proposal.currency
        });

      if (escrowError) {
        console.error('Escrow lock error:', escrowError);
        alert('Ошибка при блокировке средств. Обратитесь в поддержку.');
        throw escrowError;
      }

      if (!escrowResult?.success) {
        alert(`Не удалось заблокировать средства: ${escrowResult?.error || 'Неизвестная ошибка'}`);
        throw new Error(escrowResult?.error || 'Escrow lock failed');
      }

      const { data: freelancerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', freelancerId)
        .maybeSingle();

      const clientName = clientProfile?.name || 'Пользователь';
      const freelancerName = freelancerProfile?.name || 'Пользователь';
      const acceptedDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const itemType = proposal.order_id ? 'Заказ' : 'Объявление';

      const systemMessage = `${itemType} "${item.title}" был принят ${acceptedDate} за ${proposal.price} ${proposal.currency}, заказчик - ${clientName}, исполнитель - ${freelancerName}.\nУдачной сделки!`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: newDealChat.id,
          sender_id: clientId,
          content: systemMessage,
          type: 'system'
        });

      if (messageError) {
        console.error('System message creation error:', messageError);
      }

      const { error: proposalError } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id);

      if (proposalError) {
        console.error('Proposal update error:', proposalError);
        throw proposalError;
      }

      // Убираем отклик из списка немедленно
      setReceivedProposals(prev => prev.filter(p => p.id !== proposal.id));
      setSentProposals(prev => prev.filter(p => p.id !== proposal.id));

      alert('Отклик принят! Сделка создана.');
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Error accepting proposal:', error);
      alert(`Ошибка при принятии отклика: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setAcceptingProposal(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    const confirmed = confirm('Вы уверены, что хотите отклонить этот отклик?');
    if (!confirmed) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId);

      if (error) throw error;

      alert('Отклик отклонён');
      loadProposals();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Ошибка при отклонении отклика');
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    const confirmed = confirm('Вы уверены, что хотите отозвать этот отклик?');
    if (!confirmed) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'withdrawn' })
        .eq('id', proposalId);

      if (error) throw error;

      alert('Отклик отозван');
      loadProposals();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      alert('Ошибка при отзыве отклика');
    }
  };

  const handleDelete = async (proposalId: string) => {
    const confirmed = confirm('Вы уверены, что хотите окончательно удалить этот отклик?');
    if (!confirmed) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      alert('Отклик удалён');
      loadProposals();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Ошибка при удалении отклика');
    }
  };

  const showDetails = (proposal: any) => {
    setSelectedProposal(proposal);
    setDetailsOpen(true);
  };

  const proposals = activeTab === 'sent' ? sentProposals : receivedProposals;

  const getStatusBadge = (status: string) => {
    if (status === 'accepted') return <Badge className="bg-green-100 text-green-800">Принят</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Отклонён</Badge>;
    if (status === 'withdrawn') return <Badge className="bg-orange-100 text-orange-800">Отозван</Badge>;
    return <Badge variant="secondary">На рассмотрении</Badge>;
  };

  const getProposalTitle = (proposal: any) => {
    if (proposal.order_id && orders[proposal.order_id]) {
      return orders[proposal.order_id].title;
    }
    if (proposal.task_id && tasks[proposal.task_id]) {
      return tasks[proposal.task_id].title;
    }
    return 'Без названия';
  };

  const getItemOwnerId = (proposal: any) => {
    if (proposal.order_id && orders[proposal.order_id]) {
      return orders[proposal.order_id].user_id;
    }
    if (proposal.task_id && tasks[proposal.task_id]) {
      return tasks[proposal.task_id].user_id;
    }
    return null;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="proposals"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-7xl px-3 xs-375:px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Отклики</h1>

        <div className="flex gap-2 mb-6">
          <Button variant={activeTab === 'sent' ? 'default' : 'ghost'} onClick={() => setActiveTab('sent')}>
            Отправленные
          </Button>
          <Button variant={activeTab === 'received' ? 'default' : 'ghost'} onClick={() => setActiveTab('received')}>
            Полученные
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#6FE7C8] mx-auto mb-3" />
              <p className="text-[#3F7F6E]">Загрузка...</p>
            </CardContent>
          </Card>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-[#3F7F6E]">
                {activeTab === 'sent' ? 'Вы ещё не отправили ни одного отклика' : 'Вы ещё не получили ни одного отклика'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                className={proposal.source === 'recommendation' ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-amber-200' : ''}
              >
                <CardContent className="p-4 xs-375:p-6 relative">
                  {proposal.source === 'recommendation' && (
                    <div className="mb-4 group">
                      <div className="flex items-center gap-1.5 xs-375:gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2.5 xs-375:px-3 py-1.5 rounded-full shadow-md text-xs xs-375:text-sm w-fit">
                        <Award className="w-3.5 h-3.5 xs-375:w-4 xs-375:h-4 flex-shrink-0" />
                        <span className="font-semibold">AI рекомендация</span>
                        <Info className="w-3.5 h-3.5 xs-375:w-4 xs-375:h-4 flex-shrink-0" />
                      </div>
                      <div className="hidden sm:block absolute top-full left-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                        <p>{activeTab === 'sent' ? 'Платформа посчитала вас наиболее подходящим исполнителем для задачи.' : 'Платформа посчитала данного исполнителя наиболее подходящим для вашей задачи.'}</p>
                        <div className="absolute bottom-full left-6 mb-[-4px]">
                          <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {/* Секция с аватаром и именем */}
                    <div className="flex items-start gap-3">
                      {activeTab === 'received' && (
                        <div
                          className="hover:opacity-80 transition cursor-pointer flex-shrink-0"
                          onClick={() => navigateToProfile(proposal.user_id, user?.id)}
                        >
                          {profiles[proposal.user_id]?.avatar_url ? (
                            <img
                              src={optimizeImage(profiles[proposal.user_id].avatar_url, 40, 85)}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                              <User className="h-5 w-5 text-[#3F7F6E]" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm xs-375:text-base mb-1 flex items-center gap-1.5 flex-wrap">
                          {activeTab === 'sent' ? (
                            getProposalTitle(proposal)
                          ) : (
                            <>
                              <span>{profiles[proposal.user_id]?.name || 'Пользователь'}</span>
                              <StarRating
                                rating={profiles[proposal.user_id]?.avg_rating || 0}
                                reviewsCount={profiles[proposal.user_id]?.reviews_count || 0}
                                size="sm"
                                showCount={false}
                              />
                            </>
                          )}
                        </div>
                        {activeTab === 'sent' && getItemOwnerId(proposal) && (
                          <div className="text-xs xs-375:text-sm text-[#3F7F6E] mb-1">
                            Заказчик: {profiles[getItemOwnerId(proposal)]?.name || 'Пользователь'}
                          </div>
                        )}
                        {activeTab === 'received' && (
                          <ProfileBadges
                            avgRating={profiles[proposal.user_id]?.avg_rating}
                            reviewsCount={profiles[proposal.user_id]?.reviews_count}
                            fiveStarCount={profiles[proposal.user_id]?.five_star_count}
                            createdAt={profiles[proposal.user_id]?.created_at}
                            showStars={false}
                            compact={true}
                          />
                        )}
                      </div>
                    </div>

                    {/* Название заказа/задачи на отдельной строке */}
                    {activeTab === 'received' && (
                      <div className="font-medium text-sm">
                        {getProposalTitle(proposal)}
                      </div>
                    )}

                    {/* Разделитель */}
                    <div className="border-t"></div>

                    {/* Информация о цене и дате */}
                    <div className="flex flex-wrap items-center gap-2 xs-375:gap-3 text-xs xs-375:text-sm text-[#3F7F6E]">
                      <span className="font-medium">Цена: {proposal.currency} {proposal.price}</span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(proposal.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    {/* Разделитель перед кнопками */}
                    <div className="border-t"></div>

                    {/* Кнопки действий */}
                    <div className="flex flex-col gap-2">
                      {/* Первая строка: Статус и Принять */}
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {activeTab === 'received' && proposal.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAccept(proposal)}
                            className="px-3 xs-375:px-4"
                            disabled={acceptingProposal === proposal.id}
                          >
                            {acceptingProposal === proposal.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            {acceptingProposal === proposal.id ? 'Принимаю...' : 'Принять'}
                          </Button>
                        )}
                      </div>

                      {/* Вторая строка: Отклонить и Подробнее */}
                      {activeTab === 'received' && proposal.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(proposal.id)}
                            disabled={acceptingProposal === proposal.id}
                            className="px-3 xs-375:px-4"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Отклонить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showDetails(proposal)}
                          >
                            Подробнее
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => showDetails(proposal)}
                          className="w-full"
                        >
                          Подробнее
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedProposal && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Детали отклика
                </DialogTitle>
                <DialogDescription>
                  {getProposalTitle(selectedProposal)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                {activeTab === 'received' && (
                  <div
                    className="flex items-center gap-3 p-3 bg-[#EFFFF8] rounded-lg cursor-pointer hover:opacity-80 transition"
                    onClick={() => navigateToProfile(selectedProposal.user_id, user?.id)}
                  >
                    {profiles[selectedProposal.user_id]?.avatar_url ? (
                      <img
                        src={optimizeImage(profiles[selectedProposal.user_id].avatar_url, 48, 85)}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                        <User className="h-6 w-6 text-[#3F7F6E]" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {profiles[selectedProposal.user_id]?.name || 'Пользователь'}
                      </div>
                      <div className="text-sm text-[#3F7F6E]">Нажмите, чтобы открыть профиль</div>
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-[#3F7F6E] mb-1">Цена</div>
                    <div className="text-2xl font-bold">{selectedProposal.currency} {selectedProposal.price}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-[#3F7F6E] mb-1">Срок выполнения</div>
                    <div className="text-2xl font-bold">{selectedProposal.delivery_days} дней</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Сообщение</div>
                  <div className="p-4 bg-[#EFFFF8] rounded-lg text-sm text-[#3F7F6E]">
                    {selectedProposal.message || 'Сообщение не указано'}
                  </div>
                </div>
                {proposalOptions[selectedProposal.id] && proposalOptions[selectedProposal.id].length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Опции заказа</div>
                    <div className="space-y-2">
                      {proposalOptions[selectedProposal.id].map((option, index) => (
                        <div key={option.id} className="p-3 border rounded-lg bg-background">
                          <div className="flex items-start justify-between mb-1">
                            <div className="font-medium text-sm">{option.title}</div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{selectedProposal.currency} {option.price}</Badge>
                              <Badge variant="outline">{option.delivery_days} дней</Badge>
                            </div>
                          </div>
                          {option.description && (
                            <p className="text-xs text-[#3F7F6E] mt-1">{option.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#3F7F6E]">Дата отправки: </span>
                    <span className="font-medium">{new Date(selectedProposal.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div>
                    <span className="text-[#3F7F6E]">Статус: </span>
                    {getStatusBadge(selectedProposal.status)}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setDetailsOpen(false)}>Закрыть</Button>
                {activeTab === 'sent' && selectedProposal.status === 'pending' && (
                  <Button variant="destructive" onClick={() => handleWithdraw(selectedProposal.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Отозвать отклик
                  </Button>
                )}
                {activeTab === 'sent' && selectedProposal.status === 'withdrawn' && (
                  <Button variant="destructive" onClick={() => handleDelete(selectedProposal.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Удалить окончательно
                  </Button>
                )}
                {activeTab === 'received' && selectedProposal.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedProposal.id)}
                      disabled={acceptingProposal === selectedProposal.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Отклонить
                    </Button>
                    <Button
                      onClick={() => handleAccept(selectedProposal)}
                      className="px-6"
                      disabled={acceptingProposal === selectedProposal.id}
                    >
                      {acceptingProposal === selectedProposal.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      {acceptingProposal === selectedProposal.id ? 'Принимаю...' : 'Принять'}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Insufficient Balance Dialog */}
      <Dialog open={insufficientBalanceDialog.open} onOpenChange={(open) => setInsufficientBalanceDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Недостаточно средств
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Для принятия предложения необходимо пополнить баланс
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="bg-[#EFFFF8] border border-[#6FE7C8]/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Требуется:</span>
                <span className="text-xl font-bold text-[#3F7F6E]">
                  {insufficientBalanceDialog.required.toFixed(2)} {insufficientBalanceDialog.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Доступно:</span>
                <span className="text-xl font-semibold text-gray-600">
                  {insufficientBalanceDialog.available.toFixed(2)} {insufficientBalanceDialog.currency}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#3F7F6E]/10 to-[#6FE7C8]/10 border border-[#3F7F6E]/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Необходимо пополнить:</span>
                <span className="text-2xl font-bold text-[#3F7F6E]">
                  {(insufficientBalanceDialog.required - insufficientBalanceDialog.available).toFixed(2)} {insufficientBalanceDialog.currency}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setInsufficientBalanceDialog(prev => ({ ...prev, open: false }))}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                setInsufficientBalanceDialog(prev => ({ ...prev, open: false }));
                window.location.href = '#/wallet';
              }}
              className="flex-1 bg-[#3F7F6E] hover:bg-[#2d5f52] text-white shadow-sm"
            >
              Пополнить баланс
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
