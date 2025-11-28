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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceError, setPriceError] = useState('');

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
      const { data: orderData, error } = await getSupabase()
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !orderData) {
        alert('Заказ не найден');
        window.location.hash = '#/my-orders';
        return;
      }

      const { data: { user: authUser } } = await getSupabase().auth.getUser();
      if (authUser?.id !== orderData.user_id) {
        alert('У вас нет прав для редактирования этого заказа');
        window.location.hash = '#/my-orders';
        return;
      }

      setOrder(orderData);
      setTitle(orderData.title);
      setDescription(orderData.description);
      setMinPrice(String(orderData.price_min));
      setMaxPrice(String(orderData.price_max));
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Ошибка при загрузке заказа');
    } finally {
      setFetching(false);
    }
  };

  const validatePrices = () => {
    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (min <= 0 || max <= 0) {
      setPriceError('Цены должны быть больше нуля');
      return false;
    }

    if (max <= min) {
      setPriceError('Максимальная цена должна быть строго выше минимальной');
      return false;
    }

    setPriceError('');
    return true;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated || !order) {
      alert('Ошибка аутентификации');
      return;
    }

    if (!validatePrices()) {
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const tags = String(fd.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await getSupabase()
      .from('orders')
      .update({
        title,
        description,
        category: String(fd.get('category')),
        price_min: Number(minPrice),
        price_max: Number(maxPrice),
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
                  <Input
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Напр.: Нужен сайт‑лендинг на React"
                    required
                    minLength={30}
                    maxLength={70}
                    className="h-11"
                  />
                  <span className={`text-xs mt-1 ${title.length < 30 ? 'text-red-500' : title.length > 70 ? 'text-red-500' : 'text-gray-500'}`}>
                    От 30 до 70 символов ({title.length}/70)
                  </span>
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
                        <Input
                          name="budget_min"
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="300"
                          min="1"
                          required
                          className="h-11"
                        />
                      </div>
                    </Field>
                  }
                  right={
                    <Field label="Бюджет (макс)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4" /></span>
                        <Input
                          name="budget_max"
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="600"
                          min="1"
                          required
                          className="h-11"
                        />
                      </div>
                    </Field>
                  }
                />
                <p className="text-xs text-gray-500 -mt-2">Максимальная цена должна быть выше минимальной</p>
                {priceError && (
                  <p className="text-sm text-red-500">{priceError}</p>
                )}
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
                  <textarea
                    name="description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите задачи, критерии приёмки, ссылки на референсы"
                    className="rounded-md border px-3 py-2 bg-background"
                    minLength={200}
                    maxLength={700}
                    required
                  />
                  <span className={`text-xs mt-1 ${description.length < 200 ? 'text-red-500' : description.length > 700 ? 'text-red-500' : 'text-gray-500'}`}>
                    От 200 до 700 символов ({description.length}/700)
                  </span>
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
