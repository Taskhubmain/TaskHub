import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle, Clock, ChevronLeft, ChevronRight, Award, ExternalLink, Calendar, DollarSign, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';
import PriceDisplay from '@/components/PriceDisplay';
import SubscriptionPurchaseDialog from '@/components/SubscriptionPurchaseDialog';
import { Badge } from '@/components/ui/badge';
import { NoTranslate } from '@/components/NoTranslate';

interface Order {
  id: string;
  title: string;
  description: string;
  price_min: number;
  price_max: number;
  tags: string[];
  category: string;
  subcategory: string;
  created_at: string;
  status: string;
  user_id: string;
  views: number;
}

interface Recommendation {
  id: string;
  order_id: string;
  match_score: number;
  match_reasons: Array<{ type: string; value: string }>;
  order?: Order;
}

const ITEMS_PER_PAGE = 21;

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { selectedRegion } = useRegion();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [insufficientProfile, setInsufficientProfile] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Check subscription status
      const { data: hasActiveSub } = await supabase.rpc('has_active_recommendations_subscription', {
        p_user_id: user.id,
      });

      setHasSubscription(hasActiveSub || false);

      if (hasActiveSub) {
        const { data: days } = await supabase.rpc('get_subscription_days_remaining', {
          p_user_id: user.id,
        });
        setDaysRemaining(days || 0);

        // Check if profile has sufficient info
        const skills = profileData?.skills || [];
        const specialty = profileData?.specialty;

        if (skills.length < 6 || !specialty) {
          setInsufficientProfile(true);
        } else {
          setInsufficientProfile(false);
          // Load recommendations
          await loadRecommendations();
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('order_recommendations')
        .select(`
          id,
          order_id,
          match_score,
          match_reasons,
          orders!inner (
            id,
            title,
            description,
            price_min,
            price_max,
            tags,
            category,
            subcategory,
            created_at,
            status,
            user_id,
            views_count
          )
        `)
        .eq('user_id', user.id)
        .eq('is_visible', true)
        .eq('orders.status', 'open')
        .order('match_score', { ascending: false });

      if (error) throw error;

      // Map the data to the expected format
      // orders!inner returns the joined data as an object, not an array
      const validRecommendations = (data || [])
        .filter((rec: any) => rec.orders && typeof rec.orders === 'object')
        .map((rec: any) => {
          const orderData = rec.orders;

          return {
            id: rec.id,
            order_id: rec.order_id,
            match_score: rec.match_score,
            match_reasons: rec.match_reasons,
            order: {
              id: orderData.id,
              title: orderData.title,
              description: orderData.description,
              price_min: orderData.price_min,
              price_max: orderData.price_max,
              tags: orderData.tags || [],
              category: orderData.category,
              subcategory: orderData.subcategory,
              created_at: orderData.created_at,
              status: orderData.status,
              user_id: orderData.user_id,
              views: orderData.views_count || 0
            }
          };
        });

      setRecommendations(validRecommendations);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const generateRecommendations = async () => {
    if (!user || !hasSubscription) return;

    setGenerating(true);
    try {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate recommendations');
      }

      const result = await response.json();
      console.log('Generated recommendations:', result.count);

      // Reload recommendations
      await loadRecommendations();
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      alert('Ошибка при генерации рекомендаций: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePropose = (orderId: string) => {
    window.location.hash = `#/proposals/create?orderId=${orderId}`;
  };

  const handleSubscriptionSuccess = async () => {
    setShowPurchaseDialog(false);
    // Reload profile to check subscription status
    await loadProfile();
  };

  // Pagination
  const totalPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRecommendations = recommendations.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#6FE7C8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // NO SUBSCRIPTION VIEW
  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#3F7F6E] to-[#2F6F5E] rounded-2xl p-8 text-white shadow-xl"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">AI Рекомендации заказов</h1>
                <p className="text-white/90 text-lg">
                  Получайте персональный подбор заказов на основе вашего профиля
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Что вы получите:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Award className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>AI анализирует вашу специальность, навыки, опыт и рейтинг</span>
                </li>
                <li className="flex items-start gap-3">
                  <Tag className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Персональный подбор открытых заказов с высоким совпадением</span>
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Заказы соответствующие вашему бюджету и опыту</span>
                </li>
                <li className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Автоматическое обновление списка рекомендаций</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setShowPurchaseDialog(true)}
              className="w-full h-14 text-lg bg-white text-[#3F7F6E] hover:bg-gray-100"
            >
              Купить подписку на рекомендации
            </Button>
          </motion.div>

          <SubscriptionPurchaseDialog
            isOpen={showPurchaseDialog}
            onClose={() => setShowPurchaseDialog(false)}
            onSuccess={handleSubscriptionSuccess}
          />
        </div>
      </div>
    );
  }

  // INSUFFICIENT PROFILE VIEW
  if (insufficientProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Subscription Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#3F7F6E] to-[#2F6F5E] rounded-xl p-4 mb-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Активная подписка на рекомендации</p>
                  <p className="text-sm text-white/80">Осталось дней: {daysRemaining}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowPurchaseDialog(true)}
                variant="outline"
                className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
              >
                Продлить подписку
              </Button>
            </div>
          </motion.div>

          {/* Insufficient Profile Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-lg border-2 border-orange-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Вы указали недостаточно информации о себе в профиле
                </h2>
                <p className="text-gray-600 mb-6">
                  Для генерации персональных рекомендаций необходимо:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${profile?.skills?.length >= 6 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-700">
                      Минимум 6 тегов (указано: {profile?.skills?.length || 0})
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${profile?.specialty ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-700">
                      Специальность {profile?.specialty ? '(указана)' : '(не указана)'}
                    </span>
                  </li>
                </ul>
                <Button
                  onClick={() => window.location.hash = '#/me/profile'}
                  className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
                >
                  Заполнить профиль
                </Button>
              </div>
            </div>
          </motion.div>

          <SubscriptionPurchaseDialog
            isOpen={showPurchaseDialog}
            onClose={() => setShowPurchaseDialog(false)}
            onSuccess={handleSubscriptionSuccess}
          />
        </div>
      </div>
    );
  }

  // RECOMMENDATIONS VIEW
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#3F7F6E] to-[#2F6F5E] rounded-xl p-4 mb-6 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-semibold">Активная подписка на рекомендации</p>
                <p className="text-sm text-white/80">Осталось дней: {daysRemaining}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateRecommendations}
                disabled={generating}
                className="bg-white/20 border border-white/30 hover:bg-white/30 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Генерация...' : 'Обновить рекомендации'}
              </Button>
              <Button
                onClick={() => setShowPurchaseDialog(true)}
                variant="outline"
                className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
              >
                Продлить подписку
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Рекомендации для вас</h1>
          <p className="text-gray-600">
            AI подобрал {recommendations.length} заказов на основе вашего профиля
          </p>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-12 text-center shadow-lg"
          >
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Пока нет рекомендаций
            </h3>
            <p className="text-gray-600 mb-6">
              Нажмите кнопку "Обновить рекомендации" чтобы AI подобрал заказы для вас
            </p>
            <Button
              onClick={generateRecommendations}
              disabled={generating}
              className="bg-[#3F7F6E] hover:bg-[#2F6F5E]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Генерация...' : 'Сгенерировать рекомендации'}
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <AnimatePresence>
                {currentRecommendations.map((rec, index) => {
                  const order = rec.order;
                  if (!order) return null;

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                    >
                      {/* Match Score Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          className={`${
                            rec.match_score >= 80
                              ? 'bg-green-100 text-green-800'
                              : rec.match_score >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          Совпадение {rec.match_score}%
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('ru')}
                        </span>
                      </div>

                      {/* Order Title */}
                      <NoTranslate as="h3" className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2">
                        {order.title}
                      </NoTranslate>

                      {/* Order Description */}
                      <NoTranslate as="p" className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {order.description}
                      </NoTranslate>

                      {/* Price */}
                      <div className="mb-3 flex-shrink-0">
                        <PriceDisplay
                          amount={order.price_min}
                          maxAmount={order.price_max}
                          showRange={true}
                          fromCurrency="USD"
                        />
                      </div>

                      {/* Match Reasons */}
                      {rec.match_reasons && rec.match_reasons.length > 0 && (
                        <div className="mb-4 space-y-1">
                          {rec.match_reasons.slice(0, 2).map((reason, idx) => {
                            const parts = reason.value.split(':');
                            const translatable = parts[0] + ':';
                            const nonTranslatable = parts.slice(1).join(':');

                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#3F7F6E] mt-1.5 flex-shrink-0"></div>
                                <p className="text-xs text-gray-600">
                                  {translatable}
                                  <NoTranslate as="span">{nonTranslatable}</NoTranslate>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tags */}
                      {order.tags && order.tags.length > 0 && (
                        <NoTranslate className="flex flex-wrap gap-1 mb-4">
                          {order.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {order.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{order.tags.length - 3}
                            </span>
                          )}
                        </NoTranslate>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 items-center">
                        <Button
                          onClick={() => handlePropose(order.id)}
                          className="flex-1 bg-[#3F7F6E] hover:bg-[#2F6F5E] text-sm h-9 whitespace-nowrap"
                        >
                          Откликнуться
                        </Button>
                        <Button
                          onClick={() => window.location.hash = `#/orders/${order.id}`}
                          variant="outline"
                          className="h-9 px-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="h-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          onClick={() => goToPage(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          className={`h-10 w-10 ${
                            currentPage === page
                              ? 'bg-[#3F7F6E] hover:bg-[#2F6F5E]'
                              : ''
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="flex items-center px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="h-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        <SubscriptionPurchaseDialog
          isOpen={showPurchaseDialog}
          onClose={() => setShowPurchaseDialog(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      </div>
    </div>
  );
}
