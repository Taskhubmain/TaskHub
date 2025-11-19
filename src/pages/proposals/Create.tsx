import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Paperclip, Briefcase, Tag, Upload, Plus, ExternalLink, Trash2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';
import { useContentModeration } from '@/hooks/useContentModeration';
import { ModerationAlert } from '@/components/ui/ModerationAlert';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function ProposalsCreate() {
  const { user } = useAuth();
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const { isBlocked, blockMessage, checkContent } = useContentModeration({
    contentType: 'proposal',
  });
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderOrTaskData, setOrderOrTaskData] = useState<any>(null);
  const [currency, setCurrency] = useState('USD');
  const [options, setOptions] = useState<Array<{title: string; description: string; price: string; days: string}>>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [proposalLimitData, setProposalLimitData] = useState<{ used: number; monthStart: string; purchased: number } | null>(null);
  const [useBoost, setUseBoost] = useState(false);
  const [boostedTasksCount, setBoostedTasksCount] = useState(0);
  const [showBoostInfo, setShowBoostInfo] = useState(false);

  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const type = params.get('type') || 'order';
  const id = params.get('id') || params.get('orderId') || params.get('taskId') || '1';
  const fromRecommendation = params.get('fromRecommendation') === 'true';

  useEffect(() => {
    if (!user) {
      window.location.hash = '/login';
    } else {
      loadPortfolio();
      loadOrderOrTask();
      loadProposalLimits();
      loadBoostedTasksCount();
    }
  }, [user]);

  const loadBoostedTasksCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await getSupabase()
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_boosted', true);

      if (!error) {
        setBoostedTasksCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading boosted tasks count:', error);
    }
  };

  const loadProposalLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('proposals_used_this_month, proposals_month_start, purchased_proposals')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        const monthStart = new Date(data.proposals_month_start || new Date());
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

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

  const loadPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await getSupabase()
        .from('portfolio_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPortfolioItems(data || []);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderOrTask = async () => {
    try {
      if (type === 'order') {
        const { data } = await getSupabase()
          .from('orders')
          .select('*, profiles(name, avatar_url)')
          .eq('id', id)
          .single();

        if (data && data.user_id === user?.id) {
          alert('Вы не можете отправить отклик на свой собственный заказ');
          window.location.hash = `/orders/${id}`;
          return;
        }

        if (user) {
          const { data: existingProposal } = await getSupabase()
            .from('proposals')
            .select('id')
            .eq('order_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingProposal) {
            alert('Вы уже отправили отклик на этот заказ');
            window.location.hash = '/proposals';
            return;
          }
        }

        setOrderOrTaskData(data);
        if (data?.currency) setCurrency(data.currency);
      } else {
        const { data } = await getSupabase()
          .from('tasks')
          .select('*, profiles(name, avatar_url)')
          .eq('id', id)
          .single();

        if (data && data.user_id === user?.id) {
          alert('Вы не можете отправить отклик на своё собственное объявление');
          window.location.hash = `/tasks/${id}`;
          return;
        }

        if (user) {
          const { data: existingProposal } = await getSupabase()
            .from('proposals')
            .select('id')
            .eq('task_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingProposal) {
            alert('Вы уже отправили отклик на это объявление');
            window.location.hash = '/proposals';
            return;
          }
        }

        setOrderOrTaskData(data);
        if (data?.currency) setCurrency(data.currency);
      }
    } catch (error) {
      console.error('Error loading order/task:', error);
    }
  };

  const togglePortfolioItem = (id: string) => {
    setSelectedPortfolio(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const orderData = orderOrTaskData ? {
    id: orderOrTaskData.id,
    title: orderOrTaskData.title,
    description: orderOrTaskData.description,
    budget: type === 'order' ? `${orderOrTaskData.price_min}-${orderOrTaskData.price_max} ${orderOrTaskData.currency}` : `${orderOrTaskData.price} ${orderOrTaskData.currency}`,
    tags: orderOrTaskData.tags || [],
    author: { name: orderOrTaskData.profiles?.name || 'User', avatar: orderOrTaskData.profiles?.avatar_url }
  } : null;

  const addOption = () => {
    setOptions([...options, { title: '', description: '', price: '', days: '' }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Войдите в систему');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_muted')
      .eq('id', user?.id)
      .single();

    if (profile?.is_muted) {
      alert('Вы не можете отправлять отклики, так как ваш аккаунт замьючен');
      return;
    }

    if (type === 'order' && proposalLimitData) {
      const monthlyRemaining = Math.max(0, 90 - proposalLimitData.used);
      const totalAvailable = monthlyRemaining + proposalLimitData.purchased;

      if (totalAvailable <= 0) {
        alert('У вас закончились отклики. Купите дополнительные отклики на странице Биржа.');
        window.location.hash = '/market';
        return;
      }
    }

    if (!price || !days || !message) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (isBlocked) {
      alert(blockMessage);
      return;
    }

    if (showOptions && options.length > 0) {
      for (const opt of options) {
        if (!opt.title || !opt.price || !opt.days) {
          alert('Заполните все поля опций или удалите пустые');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const moderationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            content: message,
            contentType: 'proposal',
          }),
        }
      );

      const moderationResult = await moderationResponse.json();

      if (moderationResult.flagged && moderationResult.action === 'blocked') {
        alert(moderationResult.message || 'Ваш отклик содержит запрещенный контент');
        setLoading(false);
        return;
      }

      if (moderationResult.flagged && moderationResult.action === 'warning') {
        const proceed = confirm(`${moderationResult.message || 'Обнаружено потенциально нежелательное содержимое'}\\n\\nПродолжить?`);
        if (!proceed) {
          setLoading(false);
          return;
        }
      }

      const proposalData: any = {
        user_id: user.id,
        message,
        price: Number(price),
        currency,
        delivery_days: Number(days),
        status: 'pending',
        source: fromRecommendation ? 'recommendation' : 'manual'
      };

      if (type === 'order') {
        proposalData.order_id = id;
      } else {
        proposalData.task_id = id;
      }

      const { data: proposalResult, error } = await getSupabase()
        .from('proposals')
        .insert(proposalData)
        .select()
        .single();

      if (error) {
        console.error('Error creating proposal:', error);
        alert('Ошибка при отправке отклика: ' + error.message);
        return;
      }

      if (type === 'order' && proposalLimitData) {
        const monthlyRemaining = Math.max(0, 90 - proposalLimitData.used);
        let newUsed = proposalLimitData.used;
        let newPurchased = proposalLimitData.purchased;

        if (newPurchased > 0) {
          newPurchased -= 1;
        } else if (monthlyRemaining > 0) {
          newUsed += 1;
        }

        await getSupabase()
          .from('profiles')
          .update({
            proposals_used_this_month: newUsed,
            purchased_proposals: newPurchased,
            proposals_month_start: proposalLimitData.monthStart,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      if (showOptions && options.length > 0 && proposalResult) {
        const optionsData = options.map((opt, index) => ({
          proposal_id: proposalResult.id,
          title: opt.title,
          description: opt.description,
          price: Number(opt.price),
          delivery_days: Number(opt.days),
          order_index: index
        }));

        const { error: optionsError } = await getSupabase()
          .from('proposal_options')
          .insert(optionsData);

        if (optionsError) {
          console.error('Error creating options:', optionsError);
        }
      }

      alert('Отклик успешно отправлен!');
      window.location.hash = '/proposals';
    } catch (error) {
      console.error('Error:', error);
      alert('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = '/market';
  };

  return (
    <motion.div
      key="proposals-create"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10 py-10">
        <h1 className="text-2xl font-bold mb-6">
          Отправить отклик на {type === 'order' ? 'заказ' : 'объявление'}
        </h1>

        {type === 'order' && proposalLimitData && (
          (() => {
            const monthlyRemaining = Math.max(0, 90 - proposalLimitData.used);
            const totalAvailable = monthlyRemaining + proposalLimitData.purchased;
            return totalAvailable <= 0 ? (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Все отклики исчерпаны</p>
                  <p className="text-sm text-red-700">
                    У вас закончились отклики. Купите дополнительные отклики на странице Биржа или попробуйте в следующем месяце.
                  </p>
                </div>
              </div>
            ) : null;
          })()
        )}

        {type === 'order' && proposalLimitData && proposalLimitData.used >= 72 && proposalLimitData.used < 90 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 mb-1">Осталось мало откликов</p>
              <p className="text-sm text-orange-700">
                Использовано {proposalLimitData.used} из 90 откликов в этом месяце. Осталось: {90 - proposalLimitData.used}.
              </p>
            </div>
          </div>
        )}

        {orderData && (
          <Card className="mb-6">
            <CardHeader className="pb-3 px-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {type === 'order' ? <Briefcase className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                    {orderData.title}
                  </CardTitle>
                  <p className="text-sm text-[#3F7F6E] mt-2">{orderData.description}</p>
                </div>
              </div>
            </CardHeader>

          {/* Плашка профиля — добавлен нижний отступ */}
          <CardContent className="px-6 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a href={`#/u/${orderData.author.name.toLowerCase()}`} className="flex items-center gap-2 hover:opacity-80 transition">
                  <img src={orderData.author.avatar} alt={orderData.author.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-medium">{orderData.author.name}</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{orderData.budget}</span>
                {orderData.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <div className="mb-4 px-5 py-4 rounded-lg bg-[#EFFFF8] border border-[#6FE7C8]/20">
          <p className="text-sm text-[#3F7F6E]">
            После отправки отклика {type === 'order' ? 'заказчик' : 'автор объявления'} получит уведомление и сможет просмотреть ваше предложение.
            Если ваш отклик подойдёт, {type === 'order' ? 'заказчик' : 'автор'} сможет принять его и начать сделку.
          </p>
        </div>

        <Card>
          <CardHeader className="px-6">
            <CardTitle>Ваше предложение</CardTitle>
          </CardHeader>

          {/* Добавлен нижний отступ под формой */}
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ваша ставка (USD)</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="650"
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Срок выполнения (дней)</label>
                  <Input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="10"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Описание (макс. 700 символов)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    checkContent(e.target.value);
                  }}
                  rows={8}
                  placeholder="Опишите ваш опыт, подход к задаче и почему вы подходите для этого проекта..."
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  maxLength={700}
                  required
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#3F7F6E]">
                    {message.length}/700 символов
                  </span>
                  <ModerationAlert message={blockMessage} isVisible={isBlocked} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Опции заказа (необязательно)</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOptions(!showOptions)}
                    className="h-8 text-xs"
                  >
                    {showOptions ? 'Скрыть опции' : 'Добавить опции'}
                  </Button>
                </div>
                {showOptions && (
                  <div className="space-y-3">
                    <p className="text-xs text-[#3F7F6E] mb-2">
                      Разбейте заказ на этапы или варианты с разной ценой и сроками
                    </p>
                    {options.map((option, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-[#EFFFF8]/20 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Опция {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <Input
                            placeholder="Название опции (макс. 50)"
                            value={option.title}
                            maxLength={50}
                            onChange={(e) => updateOption(index, 'title', e.target.value)}
                          />
                          <span className="text-xs text-[#3F7F6E] mt-1">
                            {option.title.length}/50
                          </span>
                        </div>
                        <div>
                          <Input
                            placeholder="Описание (необяз., макс. 700)"
                            value={option.description}
                            maxLength={700}
                            onChange={(e) => updateOption(index, 'description', e.target.value)}
                          />
                          <span className="text-xs text-[#3F7F6E] mt-1">
                            {option.description.length}/700
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            placeholder="Цена"
                            value={option.price}
                            onChange={(e) => updateOption(index, 'price', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Срок (дней)"
                            value={option.days}
                            onChange={(e) => updateOption(index, 'days', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить опцию
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Вложение (необязательно)</label>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 h-11 px-4 rounded-md border-2 border-dashed border-[#6FE7C8]/30 hover:border-[#6FE7C8] bg-[#EFFFF8]/30 hover:bg-[#EFFFF8]/50 transition cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-[#3F7F6E]" />
                    <span className="text-sm text-[#3F7F6E]">
                      {attachment ? attachment.name : 'Выберите файл или перетащите сюда'}
                    </span>
                  </label>
                  {attachment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachment(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[#3F7F6E] mt-1">
                  Поддерживаются: PDF, DOC, DOCX, изображения (макс. 10 МБ)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading || isBlocked}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Отправка...' : 'Отправить отклик'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}
