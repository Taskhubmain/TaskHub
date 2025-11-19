import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useContentModeration } from '@/hooks/useContentModeration';
import { ModerationAlert } from '@/components/ui/ModerationAlert';

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

export default function OrderCreatePage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const { isBlocked, blockMessage, checkContent } = useContentModeration({
    contentType: 'order',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const loadSubcategories = async (categoryId: string) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    if (data) setSubcategories(data);
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

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_muted')
      .eq('id', user?.id)
      .single();

    if (profile?.is_muted) {
      alert('Вы не можете создавать заказы, так как ваш аккаунт замьючен');
      return;
    }

    if (!isAuthenticated) {
      alert('Войдите в систему для создания заказа');
      window.location.hash = '#/login';
      return;
    }

    if (!validatePrices()) {
      return;
    }

    if (isBlocked) {
      alert(blockMessage);
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);

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
            content: `${title} ${description}`,
            contentType: 'order',
          }),
        }
      );

      const moderationResult = await moderationResponse.json();

      if (moderationResult.flagged && moderationResult.action === 'blocked') {
        alert(moderationResult.message || 'Ваш заказ содержит запрещенный контент');
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
    } catch (err) {
      console.error('Moderation error:', err);
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);

    const { data: { user: authUser } } = await getSupabase().auth.getUser();
    if (!authUser) {
      alert('Ошибка аутентификации');
      window.location.hash = '#/login';
      return;
    }

    // Get category and subcategory names
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';

    const subcategoryId = String(fd.get('subcategory') || '');
    const selectedSubcategory = subcategories.find(sc => sc.id === subcategoryId);
    const subcategoryName = selectedSubcategory ? selectedSubcategory.name : null;

    const { data, error } = await getSupabase()
      .from('orders')
      .insert({
        user_id: authUser.id,
        title,
        description,
        category: categoryName,
        subcategory: subcategoryName,
        price_min: Number(minPrice),
        price_max: Number(maxPrice),
        currency: String(fd.get('currency')),
        engagement: String(fd.get('engagement')),
        deadline: fd.get('deadline') ? String(fd.get('deadline')) : null,
        tags: tagsArray,
        use_escrow: false,
        status: 'open'
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating order:', error);
      alert('Ошибка при создании заказа: ' + error.message);
      return;
    }

    alert('Заказ успешно опубликован!');
    window.location.hash = '#/market';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key="order-new" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Новый заказ</h1>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Card>
              <CardContent className="p-6 grid gap-4">
                <Field label="Заголовок">
                  <Input
                    name="title"
                    placeholder="Напр.: Нужен сайт‑лендинг на React"
                    required
                    className="h-11"
                    value={title}
                    maxLength={50}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      checkContent(`${e.target.value} ${description}`);
                    }}
                  />
                </Field>
                <ModerationAlert message={blockMessage} isVisible={isBlocked} />
                <TwoCol
                  left={
                    <Field label="Категория">
                      <select
                        className="h-11 rounded-md border px-3 bg-background"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        required
                      >
                        <option value="">Выберите категорию</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Подкатегория">
                      <select
                        name="subcategory"
                        className="h-11 rounded-md border px-3 bg-background"
                        disabled={!selectedCategoryId || subcategories.length === 0}
                      >
                        <option value="">Не выбрано (опционально)</option>
                        {subcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </Field>
                  }
                />
                <Field label="Дедлайн">
                  <div className="relative">
                    <Input name="deadline" type="date" min={getTodayDate()} className="h-11 pr-10" />
                    <Calendar className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#3F7F6E]" />
                  </div>
                </Field>
                <TwoCol
                  left={
                    <Field label="Бюджет (мин)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4" /></span>
                        <Input
                          name="budget_min"
                          type="number"
                          placeholder="300"
                          min="1"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
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
                          placeholder="600"
                          min="1"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </Field>
                  }
                />
                {priceError && (
                  <p className="text-sm text-red-500 -mt-2">{priceError}</p>
                )}
                <TwoCol
                  left={
                    <Field label="Валюта">
                      <select name="currency" className="h-11 rounded-md border px-3 bg-background">
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
                      <select name="engagement" className="h-11 rounded-md border px-3 bg-background">
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
                    placeholder="Опишите задачи, критерии приёмки, ссылки на референсы"
                    className="rounded-md border px-3 py-2 bg-background"
                    value={description}
                    maxLength={700}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      checkContent(`${title} ${e.target.value}`);
                    }}
                  />
                </Field>
                <Field label={`Теги (через запятую, макс. 10)`}>
                  <Input
                    name="tags"
                    placeholder="React, Tailwind, API"
                    className="h-11"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <span className="text-xs text-[#3F7F6E] mt-1">
                    {tags.split(',').filter(t => t.trim()).length}/10 тегов
                  </span>
                </Field>
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
                <div className="flex justify-end items-center pt-2">
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" asChild><a href="#/market">Отменить</a></Button>
                    <Button type="submit" disabled={loading || isBlocked}>{loading ? 'Публикация...' : 'Опубликовать'}</Button>
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
