import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, Upload, X, Info } from 'lucide-react';
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

export default function TaskCreatePage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [useBoost, setUseBoost] = useState(false);
  const [boostedTasksCount, setBoostedTasksCount] = useState(0);
  const [showBoostInfo, setShowBoostInfo] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [subcategoryFeatures, setSubcategoryFeatures] = useState<any[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const { isBlocked, blockMessage, checkContent } = useContentModeration({
    contentType: 'task',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (user) {
      loadBoostedTasksCount();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedSubcategoryId) {
      loadSubcategoryFeatures(selectedSubcategoryId);
    } else {
      setSubcategoryFeatures([]);
      setSelectedFeatures([]);
    }
  }, [selectedSubcategoryId]);

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

  const loadSubcategoryFeatures = async (subcategoryId: string) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('subcategory_features')
      .select('*')
      .eq('subcategory_id', subcategoryId)
      .order('sort_order');
    if (data) setSubcategoryFeatures(data);
  };

  const toggleFeature = (featureName: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureName)) {
        return prev.filter(f => f !== featureName);
      } else {
        return [...prev, featureName];
      }
    });
  };

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

  const validatePrice = () => {
    const priceNum = Number(price);

    if (priceNum <= 0) {
      setPriceError('Цена должна быть больше нуля');
      return false;
    }

    setPriceError('');
    return true;
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
      alert('Вы не можете создавать задания, так как ваш аккаунт замьючен');
      return;
    }

    if (!isAuthenticated) {
      alert('Войдите в систему для создания объявления');
      window.location.hash = '#/login';
      return;
    }

    if (!validatePrice()) {
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
            contentType: 'task',
          }),
        }
      );

      const moderationResult = await moderationResponse.json();

      if (moderationResult.flagged && moderationResult.action === 'blocked') {
        alert(moderationResult.message || 'Ваше объявление содержит запрещенный контент');
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

    const selectedSubcategory = subcategories.find(sc => sc.id === selectedSubcategoryId);
    const subcategoryName = selectedSubcategory ? selectedSubcategory.name : null;

    const { data, error } = await getSupabase()
      .from('tasks')
      .insert({
        user_id: authUser.id,
        title,
        description,
        category: categoryName,
        subcategory: subcategoryName,
        price: Number(price),
        currency: String(fd.get('currency')),
        delivery_days: Number(fd.get('delivery_days')),
        tags: tagsArray,
        features: selectedFeatures,
        status: 'active',
        is_boosted: useBoost,
        boost_commission_rate: useBoost ? 25.00 : 0.00
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating task:', error);
      alert('Ошибка при создании объявления: ' + error.message);
      return;
    }

    alert('Объявление успешно опубликовано!');
    window.location.hash = '#/market';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key="task-new" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Новый Task (предложение фрилансера)</h1>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Card>
              <CardContent className="p-6 grid gap-4">
                <Field label="Название">
                  <Input
                    name="title"
                    placeholder="Сделаю адаптивный лендинг на React / Next"
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
                        className="h-11 rounded-md border px-3 bg-background"
                        value={selectedSubcategoryId}
                        onChange={(e) => setSelectedSubcategoryId(e.target.value)}
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
                {subcategoryFeatures.length > 0 && (
                  <Field label="Что входит (выберите до 10)">
                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-md bg-gray-50">
                      {subcategoryFeatures.map((feature) => (
                        <label
                          key={feature.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.name)}
                            onChange={() => toggleFeature(feature.name)}
                            className="w-4 h-4 rounded border-gray-300 text-[#3F7F6E] focus:ring-[#3F7F6E]"
                          />
                          <span className="text-sm">{feature.name}</span>
                        </label>
                      ))}
                    </div>
                    {selectedFeatures.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Выбрано: {selectedFeatures.length} из 10
                      </div>
                    )}
                  </Field>
                )}
                <Field label="Срок выполнения (дней)">
                  <div className="relative">
                    <Input name="delivery_days" type="number" placeholder="7" min="1" required className="h-11 pr-10" />
                    <Clock className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#3F7F6E]" />
                  </div>
                </Field>
                <TwoCol
                  left={
                    <Field label="Цена">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4" /></span>
                        <Input
                          name="price"
                          type="number"
                          placeholder="300"
                          min="1"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </Field>
                  }
                  right={
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
                />
                <Field label="Описание">
                  <textarea
                    name="description"
                    rows={6}
                    placeholder="Опишите опыт, стек, процесс и критерии качества"
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
                    placeholder="React, Tailwind, SSR"
                    className="h-11"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <span className="text-xs text-[#3F7F6E] mt-1">
                    {tags.split(',').filter(t => t.trim()).length}/10 тегов
                  </span>
                </Field>
                {priceError && (
                  <p className="text-sm text-red-500 -mt-2">{priceError}</p>
                )}

                <div className={`relative p-4 rounded-lg border-2 transition ${
                  boostedTasksCount >= 3 ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-[#6FE7C8]/10 to-[#3F7F6E]/10 border-[#6FE7C8]'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="use-boost"
                      checked={useBoost}
                      onChange={(e) => setUseBoost(e.target.checked)}
                      disabled={boostedTasksCount >= 3}
                      className="mt-1 h-4 w-4 rounded border-[#3F7F6E] text-[#6FE7C8] focus:ring-[#6FE7C8] disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="use-boost"
                        className={`font-medium text-sm flex items-center gap-2 ${
                          boostedTasksCount >= 3 ? 'text-gray-500' : 'text-[#3F7F6E] cursor-pointer'
                        }`}
                      >
                        Использовать продвижение
                        <div
                          className="relative"
                          onMouseEnter={() => setShowBoostInfo(true)}
                          onMouseLeave={() => setShowBoostInfo(false)}
                        >
                          <div className="h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs cursor-help">
                            <Info className="h-3 w-3" />
                          </div>
                          {showBoostInfo && (
                            <div className="absolute left-0 top-6 z-50 w-72 p-3 bg-white border border-[#6FE7C8] rounded-lg shadow-lg text-xs text-gray-700 leading-relaxed">
                              Ваше объявление получит ленточку &quot;Продвижение&quot; и будет поднято вверх списка объявлений в категории при публикации, но процентная ставка по заказу будет повышена до 25%. В целях сокращения продвинутых объявлений вы можете поставить данную опцию только на 3 ваших объявления
                            </div>
                          )}
                        </div>
                      </label>
                      {boostedTasksCount >= 3 && (
                        <p className="text-xs text-red-600 mt-1">
                          У вас уже 3 активных объявления с продвижением. Отключите продвижение на одном из них, чтобы активировать здесь.
                        </p>
                      )}
                      {useBoost && boostedTasksCount < 3 && (
                        <p className="text-xs text-[#3F7F6E] mt-1">
                          Комиссия платформы будет составлять 25% вместо стандартной ставки
                        </p>
                      )}
                    </div>
                  </div>
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
