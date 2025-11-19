import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{left}{right}</div>
  );
}

interface OrderData {
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
  use_escrow: boolean;
}

export default function OrderEditPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    const orderId = window.location.hash.split('/')[2];
    if (!orderId) {
      alert('ID заказа не найден');
      window.location.hash = '#/my-deals';
      return;
    }

    try {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !orderData) {
        alert('Заказ не найден');
        window.location.hash = '#/my-deals';
        return;
      }

      const { data: { user: authUser } } = await getSupabase().auth.getUser();
      if (authUser?.id !== orderData.user_id) {
        alert('У вас нет прав для редактирования этого заказа');
        window.location.hash = '#/my-deals';
        return;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Ошибка при загрузке заказа');
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated || !order) {
      alert('Ошибка аутентификации');
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const tags = String(fd.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await supabase
      .from('orders')
      .update({
        title: String(fd.get('title')),
        description: String(fd.get('description') || ''),
        category: String(fd.get('category')),
        price_min: Number(fd.get('budget_min')),
        price_max: Number(fd.get('budget_max')),
        currency: String(fd.get('currency')),
        engagement: String(fd.get('engagement')),
        deadline: fd.get('deadline') ? String(fd.get('deadline')) : null,
        tags,
        use_escrow: fd.get('escrow') === 'on',
      })
      .eq('id', order.id);

    setLoading(false);

    if (error) {
      console.error('Error updating order:', error);
      alert('Ошибка при обновлении заказа: ' + error.message);
      return;
    }

    alert('Заказ успешно обновлён!');
    window.location.hash = '#/my-deals';
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-[#3F7F6E]">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key="order-edit" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Редактировать заказ</h1>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Card>
              <CardContent className="p-6 grid gap-4">
                <Field label="Заголовок">
                  <Input name="title" defaultValue={order.title} placeholder="Напр.: Нужен сайт‑лендинг на React" required className="h-11" />
                </Field>
                <TwoCol
                  left={
                    <Field label="Категория">
                      <select name="category" defaultValue={order.category} className="h-11 rounded-md border px-3 bg-background">
                        <option>Разработка</option>
                        <option>Дизайн</option>
                        <option>Маркетинг</option>
                        <option>Локализация</option>
                        <option>Копирайт</option>
                        <option>QA / Безопасность</option>
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Дедлайн">
                      <div className="relative">
                        <Input name="deadline" type="date" defaultValue={order.deadline || ''} className="h-11 pr-10" />
                        <Calendar className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#3F7F6E]" />
                      </div>
                    </Field>
                  }
                />
                <TwoCol
                  left={
                    <Field label="Бюджет (мин)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4" /></span>
                        <Input name="budget_min" type="number" defaultValue={order.price_min} placeholder="300" className="h-11" />
                      </div>
                    </Field>
                  }
                  right={
                    <Field label="Бюджет (макс)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4" /></span>
                        <Input name="budget_max" type="number" defaultValue={order.price_max} placeholder="600" className="h-11" />
                      </div>
                    </Field>
                  }
                />
                <TwoCol
                  left={
                    <Field label="Валюта">
                      <select name="currency" defaultValue={order.currency} className="h-11 rounded-md border px-3 bg-background">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>KZT</option>
                        <option>RUB</option>
                        <option>PLN</option>
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Тип занятости">
                      <select name="engagement" defaultValue={order.engagement} className="h-11 rounded-md border px-3 bg-background">
                        <option>Фикс‑прайс</option>
                        <option>Почасовая</option>
                      </select>
                    </Field>
                  }
                />
                <Field label="Описание">
                  <textarea name="description" rows={6} defaultValue={order.description} placeholder="Опишите задачи, критерии приёмки, ссылки на референсы" className="rounded-md border px-3 py-2 bg-background" />
                </Field>
                <Field label="Теги (через запятую)">
                  <Input name="tags" defaultValue={order.tags.join(', ')} placeholder="React, Tailwind, API" className="h-11" />
                </Field>
                <div className="flex items-center gap-2">
                  <input id="escrow" name="escrow" type="checkbox" className="h-4 w-4" defaultChecked={order.use_escrow} />
                  <label htmlFor="escrow" className="text-sm">Использовать эскроу</label>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-[#3F7F6E]">Изменения сохраняются в БД</div>
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" asChild><a href="#/my-deals">Отменить</a></Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить изменения'}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
