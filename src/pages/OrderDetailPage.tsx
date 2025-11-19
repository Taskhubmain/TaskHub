import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, DollarSign, Calendar, Send, Handshake, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import FavoriteButton from '@/components/ui/FavoriteButton';
import PriceDisplay from '@/components/PriceDisplay';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface Order {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number;
  price_max: number;
  currency: string;
  engagement: string;
  deadline: string | null;
  tags: string[];
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  name: string;
  avatar_url: string | null;
  email: string;
}

export default function OrderDetailPage() {
  const { user } = useAuth();
  const [proposalText, setProposalText] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProposal, setHasProposal] = useState(false);
  const [userProposal, setUserProposal] = useState<any>(null);
  const isOwner = user && order && user.id === order.user_id;

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    const orderId = window.location.hash.split('/').pop();
    if (!orderId) return;

    try {
      const supabase = getSupabase();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError || !orderData) {
        console.error('Error loading order:', orderError);
        return;
      }

      setOrder(orderData);

      await supabase
        .from('orders')
        .update({ views_count: (orderData.views_count || 0) + 1 })
        .eq('id', orderId);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, email')
        .eq('id', orderData.user_id)
        .maybeSingle();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      if (user) {
        const { data: existingProposal } = await supabase
          .from('proposals')
          .select('*')
          .eq('order_id', orderId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProposal) {
          setHasProposal(true);
          setUserProposal(existingProposal);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Proposal submitted:', { proposalText, proposalPrice });
    alert('Отклик отправлен (демо)');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-[#3F7F6E]">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Заказ не найден</h2>
          <Button asChild><a href="#/market">Вернуться на биржу</a></Button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="order-detail"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3">{order.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{order.category}</Badge>
                        <Badge variant="outline">{order.engagement}</Badge>
                        {order.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <FavoriteButton itemId={order.id} itemType="order" />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-[#3F7F6E] leading-relaxed whitespace-pre-wrap">{order.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[#3F7F6E]">
                      <DollarSign className="h-4 w-4" />
                      <span className="flex items-center gap-1">
                        Бюджет: <PriceDisplay amount={order.price_min} maxAmount={order.price_max} fromCurrency={order.currency} showRange={true} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#3F7F6E]">
                      <Calendar className="h-4 w-4" />
                      <span>Дедлайн: {order.deadline ? new Date(order.deadline).toLocaleDateString('ru-RU') : 'Не указан'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {profile && (
                      <Button asChild variant="outline">
                        <a href={`#/users/${order.user_id}`}>
                          <User className="h-4 w-4 mr-2" />
                          Профиль
                        </a>
                      </Button>
                    )}
                    {!isOwner && (
                      <>
                        {hasProposal ? (
                          <Button asChild variant="outline">
                            <a href="#/proposals">
                              <Send className="h-4 w-4 mr-2" />
                              Ваш отклик
                            </a>
                          </Button>
                        ) : (
                          <Button asChild>
                            <a href={`#/proposals/create?type=order&id=${order.id}`}>
                              <Send className="h-4 w-4 mr-2" />
                              Откликнуться
                            </a>
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <a href={`#/deal/open?type=order&id=${order.id}`}>
                            <Handshake className="h-4 w-4 mr-2" />
                            Открыть сделку
                          </a>
                        </Button>
                        {profile && (
                          <Button asChild variant="outline">
                            <a href={`#/messages?to=${profile.email}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Написать
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Отправить отклик</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitProposal} className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Ваше предложение</label>
                      <textarea
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        rows={6}
                        placeholder="Опишите ваш опыт, подход к задаче и сроки"
                        className="w-full rounded-md border px-3 py-2 bg-background"
                        required
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Ваша цена ({order.currency})</label>
                        <Input
                          type="number"
                          value={proposalPrice}
                          onChange={(e) => setProposalPrice(e.target.value)}
                          placeholder="650"
                          required
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Срок выполнения (дней)</label>
                        <Input
                          type="number"
                          placeholder="10"
                          required
                          className="h-11"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Отправить отклик
                    </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {profile && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Заказчик</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                        <User className="h-6 w-6 text-[#3F7F6E]" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{profile?.name || 'Пользователь'}</div>
                      <div className="text-sm text-[#3F7F6E]">{profile?.email}</div>
                    </div>
                  </div>
                  {profile && (
                    <Button variant="secondary" className="w-full" asChild>
                      <a href={`#/messages?to=${profile.email}`}>Написать сообщение</a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Информация</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Опубликовано</span>
                    <span className="font-medium">{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Статус</span>
                    <Badge variant="secondary">{order.status === 'open' ? 'Открыт' : order.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
