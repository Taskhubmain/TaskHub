import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Calendar, TrendingUp, Lock, Award, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/PriceDisplay';
import SubscriptionPurchaseDialog from '@/components/SubscriptionPurchaseDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Recommendation {
  id: string;
  order_id: string;
  match_score: number;
  match_reasons: Array<{ type: string; value: string }>;
  order: {
    id: string;
    title: string;
    description: string;
    price_min: number;
    price_max: number;
    tags: string[];
    created_at: string;
    status: string;
  };
}

interface Order {
  id: string;
  title: string;
  description: string;
  price_min: number;
  price_max: number;
  tags: string[];
  created_at: string;
  status: string;
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [generalOrders, setGeneralOrders] = useState<Order[]>([]);
  const [skillsWarning, setSkillsWarning] = useState('');
  const [specialtyWarning, setSpecialtyWarning] = useState('');
  const [showingFallbackOrders, setShowingFallbackOrders] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (hasSubscription !== null && profile) {
      if (hasSubscription) {
        // Auto-generate recommendations on page entry
        generateRecommendations();
      } else {
        loadGeneralOrders();
      }
    }
  }, [hasSubscription, profile]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const skills = profileData?.skills || [];
      if (skills.length === 0) {
        setSkillsWarning('У вас мало навыков, попробуйте добавить больше!');
      } else if (skills.length < 8) {
        setSkillsWarning('У вас мало навыков, попробуйте добавить больше!');
      }

      if (!profileData?.specialty && !profileData?.category) {
        setSpecialtyWarning('Укажите специальность для точных рекомендаций!');
      }

      const { data, error } = await supabase.rpc('has_active_recommendations_subscription', {
        p_user_id: user.id,
      });

      if (error) throw error;

      setHasSubscription(data || false);

      if (data) {
        const { data: days } = await supabase.rpc('get_subscription_days_remaining', {
          p_user_id: user.id,
        });
        setDaysRemaining(days || 0);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setHasSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, description, price_min, price_max, tags, created_at, status')
        .eq('status', 'open')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, 20);
      setGeneralOrders(shuffled);
    } catch (err) {
      console.error('Error loading general orders:', err);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_recommendations')
        .select(`
          id,
          order_id,
          match_score,
          match_reasons,
          order:orders (
            id,
            title,
            description,
            price_min,
            price_max,
            tags,
            created_at,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('is_visible', true)
        .order('match_score', { ascending: false });

      if (error) throw error;

      const validRecommendations = (data || []).filter(rec => rec.order && rec.order.id);

      if (validRecommendations.length === 0) {
        console.log('No AI recommendations found, loading fallback');
        setShowingFallbackOrders(true);
        await loadFallbackOrders();
      } else {
        setShowingFallbackOrders(false);
        setRecommendations(validRecommendations);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setShowingFallbackOrders(true);
      await loadFallbackOrders();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackOrders = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, description, price_min, price_max, tags, created_at, status')
        .eq('status', 'open')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      let filteredOrders = data || [];
      const skills = profile?.skills || [];
      const specialty = profile?.specialty || '';

      console.log('Profile data:', { skills, specialty });
      console.log('Total orders fetched:', filteredOrders.length);

      if (skills.length > 0 || specialty.length > 0) {
        const skillsLower = skills.map((s: string) => s.toLowerCase());
        const specialtyLower = specialty.toLowerCase();

        const matchedOrders = filteredOrders.filter(order => {
          const titleLower = order.title.toLowerCase();
          const descLower = (order.description || '').toLowerCase();
          const tagsLower = (order.tags || []).map((t: string) => t.toLowerCase()).join(' ');
          const searchText = `${titleLower} ${descLower} ${tagsLower}`;

          const skillMatch = skillsLower.some((skill: string) => searchText.includes(skill));
          const specialtyMatch = specialtyLower && searchText.includes(specialtyLower);

          return skillMatch || specialtyMatch;
        });

        console.log('Matched orders:', matchedOrders.length);

        if (matchedOrders.length > 0) {
          filteredOrders = matchedOrders;
        }
      }

      const shuffled = filteredOrders.sort(() => Math.random() - 0.5).slice(0, 20);

      const formattedOrders = shuffled.map(order => {
        const titleLower = order.title.toLowerCase();
        const descLower = (order.description || '').toLowerCase();
        const tagsLower = (order.tags || []).map((t: string) => t.toLowerCase()).join(' ');
        const searchText = `${titleLower} ${descLower} ${tagsLower}`;

        let matchScore = 40;
        const matchingSkills = skillsLower.filter((skill: string) => searchText.includes(skill));
        const matchesSpecialty = specialtyLower && searchText.includes(specialtyLower);

        if (matchingSkills.length > 0) {
          matchScore += Math.min(40, matchingSkills.length * 10);
        }
        if (matchesSpecialty) {
          matchScore += 20;
        }

        return {
          id: crypto.randomUUID(),
          order_id: order.id,
          match_score: Math.min(100, matchScore),
          match_reasons: [],
          order: order
        };
      });

      setRecommendations(formattedOrders);
    } catch (err) {
      console.error('Error loading fallback orders:', err);
    }
  };

  const generateRecommendations = async () => {
    if (!user || !hasSubscription) return;

    try {
      setGenerating(true);
      console.log('Generating recommendations for user:', user.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-order-recommendations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      console.log('Generation result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate recommendations');
      }

      if (result.count === 0) {
        console.log('No recommendations generated by AI, loading fallback');
        setShowingFallbackOrders(true);
        await loadFallbackOrders();
      } else {
        await loadRecommendations();
      }
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      alert(err.message || 'Ошибка при генерации рекомендаций');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    loadProfile();
    setShowPurchaseDialog(false);
  };

  const paginatedRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return recommendations.slice(startIndex, endIndex);
  }, [recommendations, currentPage]);

  const totalPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Войдите, чтобы увидеть рекомендации</p>
          <Button asChild>
            <a href="#/login">Войти</a>
          </Button>
        </div>
      </div>
    );
  }

  if (hasSubscription === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#3F7F6E]" />
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <>
        {(skillsWarning || specialtyWarning) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 mx-4 mt-4 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-700 break-words">
                  {skillsWarning && <span>{skillsWarning}</span>}
                  {skillsWarning && specialtyWarning && <span className="mx-1">•</span>}
                  {specialtyWarning && <span>{specialtyWarning}</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {specialtyWarning && generalOrders.length > 0 ? (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h1 className="text-2xl font-bold mb-2">Общие рекомендации</h1>
                <p className="text-gray-600">
                  Кажется для вас нет ничего подходящего, но возможно эти объявления вам подойдут
                </p>
              </div>

              <div className="grid gap-4">
                {generalOrders.map((order) => (
                  <a
                    key={order.id}
                    href={`#/orders/${order.id}`}
                    className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold mb-2">{order.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {order.description}
                    </p>
                    <div className="text-xl font-bold text-[#3F7F6E]">
                      <PriceDisplay amount={order.price_min} />
                      {order.price_max > order.price_min && (
                        <span className="text-gray-500"> - <PriceDisplay amount={order.price_max} /></span>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-r from-[#3F7F6E]/10 to-[#2F6F5E]/10 rounded-2xl p-8 text-center">
                <h2 className="text-xl font-bold mb-4">Хотите персональные рекомендации?</h2>
                <p className="text-gray-600 mb-6">
                  Укажите специальность и подключите AI-рекомендации для точного подбора заказов
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button asChild variant="outline">
                    <a href="#/profile">Заполнить профиль</a>
                  </Button>
                  <Button
                    onClick={() => setShowPurchaseDialog(true)}
                    className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Подключить рекомендации
                  </Button>
                </div>
              </div>
            </div>

            <SubscriptionPurchaseDialog
              isOpen={showPurchaseDialog}
              onClose={() => setShowPurchaseDialog(false)}
              onSuccess={handleSubscriptionSuccess}
            />
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#3F7F6E] to-[#2F6F5E] px-8 py-12 text-center text-white">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">Рекомендации заказов с AI</h1>
                  <p className="text-lg text-white/90 max-w-2xl mx-auto">
                    Персональный подбор заказов на основе анализа ваших навыков, опыта и предпочтений
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3F7F6E]/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-[#3F7F6E]" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Умный анализ</h3>
                        <p className="text-sm text-gray-600">
                          AI анализирует ваш профиль, навыки, средний чек и историю работ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3F7F6E]/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-[#3F7F6E]" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Высокое соответствие</h3>
                        <p className="text-sm text-gray-600">
                          Получайте только те заказы, которые идеально подходят вам
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3F7F6E]/10 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-6 h-6 text-[#3F7F6E]" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Автообновление</h3>
                        <p className="text-sm text-gray-600">
                          Список рекомендаций обновляется автоматически
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#3F7F6E]/10 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6 text-[#3F7F6E]" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Актуальность</h3>
                        <p className="text-sm text-gray-600">
                          Недоступные заказы автоматически убираются из списка
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-8 border-t">
                    <Button
                      onClick={() => setShowPurchaseDialog(true)}
                      size="lg"
                      className="h-14 px-12 text-lg bg-[#3F7F6E] hover:bg-[#2F6F5E]"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Подключить рекомендации
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <SubscriptionPurchaseDialog
              isOpen={showPurchaseDialog}
              onClose={() => setShowPurchaseDialog(false)}
              onSuccess={handleSubscriptionSuccess}
            />
          </div>
        )}
      </>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -16 }
  };

  const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="recommendations"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-gray-50"
      >
      {(skillsWarning || specialtyWarning) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-700 break-words">
                {skillsWarning && <span>{skillsWarning}</span>}
                {skillsWarning && specialtyWarning && <span className="mx-1">•</span>}
                {specialtyWarning && <span>{specialtyWarning}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Рекомендации заказов</h1>
              <p className="text-gray-600">
                {showingFallbackOrders
                  ? `Мы нашли для вас следующие объявления`
                  : `AI подобрал для вас ${recommendations.length} подходящих заказов`
                }
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-[#3F7F6E]/10 to-[#2F6F5E]/10 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-[#3F7F6E] mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Подписка активна</span>
                </div>
                <div className="text-xs text-gray-600">
                  Осталось дней: <span className="font-semibold">{daysRemaining}</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#3F7F6E] h-full transition-all rounded-full"
                    style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                  />
                </div>
              </div>

              <Button
                onClick={generateRecommendations}
                disabled={generating}
                className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Обновление...' : 'Обновить'}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#3F7F6E]" />
            <p className="text-gray-600 mt-4">Загрузка рекомендаций...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Пока нет рекомендаций</h3>
            <p className="text-gray-600 mb-6">
              Нажмите "Обновить", чтобы получить персональные рекомендации заказов
            </p>
            <Button onClick={generateRecommendations} disabled={generating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Сгенерировать рекомендации
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedRecommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => {
                  setPreviewItem(rec.order);
                  setPreviewOpen(true);
                }}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{rec.order.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {rec.order.description}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        {rec.match_score}% совпадение
                      </span>
                    </div>
                    <div className="text-xl font-bold text-[#3F7F6E]">
                      <PriceDisplay amount={rec.order.price_min} />
                      {rec.order.price_max > rec.order.price_min && (
                        <span className="text-gray-500"> - <PriceDisplay amount={rec.order.price_max} /></span>
                      )}
                    </div>
                  </div>
                </div>

                {rec.match_reasons && rec.match_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rec.match_reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="bg-[#3F7F6E]/10 text-[#3F7F6E] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {reason.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 px-4">
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 p-0"
                >
                  &lt;
                </Button>
                {(() => {
                  const pages: number[] = [];

                  if (currentPage === 1) {
                    pages.push(1);
                    if (totalPages >= 2) pages.push(2);
                    if (totalPages >= 3) pages.push(3);
                  } else if (currentPage === totalPages) {
                    if (totalPages >= 3) pages.push(totalPages - 2);
                    if (totalPages >= 2) pages.push(totalPages - 1);
                    pages.push(totalPages);
                  } else {
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    if (currentPage + 1 <= totalPages) pages.push(currentPage + 1);
                  }

                  return pages.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => goToPage(page)}
                      className={`h-10 w-10 p-0 ${
                        currentPage === page
                          ? 'bg-[#3F7F6E] text-white hover:bg-[#2F6F5E]'
                          : ''
                      }`}
                    >
                      {page}
                    </Button>
                  ));
                })()}
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 p-0"
                >
                  &gt;
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          {previewItem && (
            <>
              <DialogHeader>
                <DialogTitle>{previewItem.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary">{previewItem.category || 'Разработка'}</Badge>
                  {previewItem.subcategory && <Badge variant="outline">{previewItem.subcategory}</Badge>}
                  {previewItem.engagement && <Badge variant="outline">{previewItem.engagement}</Badge>}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Описание</div>
                  <p className="text-sm text-[#3F7F6E]">{previewItem.description}</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Теги</div>
                  <div className="flex flex-wrap gap-2">
                    {(previewItem.tags || []).map((t: string) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <div className="text-sm text-gray-500">Бюджет</div>
                    <div className="text-2xl font-bold text-[#3F7F6E]">
                      <PriceDisplay amount={previewItem.price_min} currency={previewItem.currency} />
                      {previewItem.price_max > previewItem.price_min && (
                        <span> - <PriceDisplay amount={previewItem.price_max} currency={previewItem.currency} /></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Закрыть
                </Button>
                <Button
                  onClick={() => {
                    window.location.hash = `/proposals/create?orderId=${previewItem.id}&fromRecommendation=true`;
                  }}
                  className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
                >
                  Откликнуться
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
