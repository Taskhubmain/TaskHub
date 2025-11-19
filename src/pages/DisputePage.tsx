import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PriceDisplay from '@/components/PriceDisplay';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface Dispute {
  id: string;
  deal_id: string;
  order_id: string | null;
  task_id: string | null;
  opened_by: string;
  status: string;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  deal?: any;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

export default function DisputePage() {
  const hash = window.location.hash;
  const id = hash.split('/').pop() || '';
  const { user } = useAuth();
  const supabase = getSupabase();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionSide, setResolutionSide] = useState<'client' | 'freelancer' | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadDispute();
  }, [id]);

  const loadDispute = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: disputeData, error: disputeError } = await supabase
        .from('disputes')
        .select(`
          *,
          deal:deals(
            id,
            status,
            price,
            currency,
            client_id,
            freelancer_id,
            order_id,
            task_id,
            chat_id,
            client:profiles!deals_client_id_fkey(id, name, avatar_url),
            freelancer:profiles!deals_freelancer_id_fkey(id, name, avatar_url),
            order:orders(id, title, description),
            task:tasks(id, title, description)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (disputeError) throw disputeError;
      if (!disputeData) {
        window.location.hash = '#/my-deals';
        return;
      }

      setDispute(disputeData);

      if (disputeData.deal?.chat_id) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            created_at,
            sender:profiles(name, avatar_url)
          `)
          .eq('chat_id', disputeData.deal.chat_id)
          .order('created_at', { ascending: true });

        if (!messagesError && messagesData) {
          setMessages(messagesData);
        }
      }
    } catch (error) {
      console.error('Error loading dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!dispute || !resolutionSide) return;

    try {
      setResolving(true);

      const status = resolutionSide === 'client' ? 'resolved_client' : 'resolved_freelancer';
      const winnerId = resolutionSide === 'client' ? dispute.deal.client_id : dispute.deal.freelancer_id;

      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          status,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', dispute.id);

      if (updateError) throw updateError;

      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: 'completed' })
        .eq('id', dispute.deal_id);

      if (dealError) throw dealError;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: dispute.deal.chat_id,
          sender_id: user!.id,
          content: `Спор разрешен в пользу ${resolutionSide === 'client' ? 'заказчика' : 'исполнителя'}`,
          content_type: 'system'
        });

      if (messageError) console.error('Error sending message:', messageError);

      window.location.hash = '#/admin/disputes';
    } catch (error) {
      console.error('Error resolving dispute:', error);
    } finally {
      setResolving(false);
      setShowResolveDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FE7C8]" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-lg">Спор не найден</p>
      </div>
    );
  }

  const deal = dispute.deal;
  const workItem = deal.order || deal.task;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Спор
                </CardTitle>
                {dispute.status === 'open' ? (
                  <Badge className="bg-amber-500">Открыт</Badge>
                ) : dispute.status === 'resolved_client' ? (
                  <Badge className="bg-green-500">Решен в пользу заказчика</Badge>
                ) : dispute.status === 'resolved_freelancer' ? (
                  <Badge className="bg-green-500">Решен в пользу исполнителя</Badge>
                ) : (
                  <Badge variant="secondary">Отменен</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Информация о сделке</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-medium">{workItem?.title}</p>
                  <p className="text-sm text-gray-600">{workItem?.description}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-sm text-gray-500">Сумма:</span>
                    <span className="font-semibold">
                      <PriceDisplay amount={deal.price} fromCurrency={deal.currency} />
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Стороны спора</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Заказчик</p>
                    <div className="flex items-center gap-2">
                      {deal.client.avatar_url && (
                        <img
                          src={deal.client.avatar_url}
                          alt={deal.client.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">{deal.client.name}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Исполнитель</p>
                    <div className="flex items-center gap-2">
                      {deal.freelancer.avatar_url && (
                        <img
                          src={deal.freelancer.avatar_url}
                          alt={deal.freelancer.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">{deal.freelancer.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && dispute.status === 'open' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setResolutionSide('client');
                      setShowResolveDialog(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Решить в пользу заказчика
                  </Button>
                  <Button
                    onClick={() => {
                      setResolutionSide('freelancer');
                      setShowResolveDialog(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Решить в пользу исполнителя
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Переписка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Сообщений пока нет</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-[#6FE7C8] text-white ml-4'
                          : 'bg-gray-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender?.avatar_url && (
                          <img
                            src={message.sender.avatar_url}
                            alt={message.sender.name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-sm font-medium">
                          {message.sender?.name}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение решения</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите решить спор в пользу{' '}
              {resolutionSide === 'client' ? 'заказчика' : 'исполнителя'}?
              Средства будут переведены выбранной стороне.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              disabled={resolving}
            >
              Отмена
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolving}
              className="bg-green-600 hover:bg-green-700"
            >
              {resolving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Подтвердить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
