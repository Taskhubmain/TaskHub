import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error} = await getSupabase()
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
      const { error } = await getSupabase()
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert('Заказ удалён');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Ошибка при удалении заказа');
    }
  };

  const handlePause = async (orderId: string) => {
    try {
      const { error } = await getSupabase()
        .from('orders')
        .update({ status: 'paused' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paused' } : o));
      alert('Заказ приостановлен');
    } catch (error) {
      console.error('Error pausing order:', error);
      alert('Ошибка при приостановке заказа');
    }
  };

  const handleResume = async (orderId: string) => {
    try {
      const { error } = await getSupabase()
        .from('orders')
        .update({ status: 'open' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'open' } : o));
      alert('Заказ возобновлён');
    } catch (error) {
      console.error('Error resuming order:', error);
      alert('Ошибка при возобновлении заказа');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-[#3F7F6E] mb-4">Войдите в систему для просмотра ваших заказов</p>
            <Button asChild>
              <a href="#/login">Войти</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="my-orders"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Мои заказы</h1>
            <Button asChild>
              <a href="#/order/new">
                <Plus className="h-4 w-4 mr-2" />
                Создать заказ
              </a>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-[#3F7F6E]">Загрузка...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-[#3F7F6E] mb-4">У вас пока нет заказов</p>
                <Button asChild>
                  <a href="#/order/new">Создать первый заказ</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base leading-6">{order.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{order.category}</Badge>
                        <Badge variant={order.status === 'open' ? 'default' : 'outline'}>
                          {order.status === 'open' ? 'Открыт' : order.status === 'in_progress' ? 'В работе' : order.status === 'completed' ? 'Завершён' : 'Отменён'}
                        </Badge>
                        {order.is_boosted && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Продвинут
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 px-6 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(order.tags || []).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      <div className="text-sm text-[#3F7F6E] line-clamp-2 mb-3">{order.description}</div>
                      <div className="font-semibold">
                        {order.currency} {order.price_min}–{order.price_max}
                      </div>
                      <div className="text-xs text-[#3F7F6E] mt-2">
                        Создан: {new Date(order.created_at).toLocaleDateString()}
                      </div>

                      {/* Показываем кнопки только если заказ НЕ завершён */}
                      {order.status !== 'completed' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.hash = `#/order/${order.id}/edit`}
                            className="flex-1"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Редактировать
                          </Button>
                          {order.status === 'open' || order.status === 'paused' ? (
                            order.status === 'open' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePause(order.id)}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Приостановить
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResume(order.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Возобновить
                              </Button>
                            )
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Удалить
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
