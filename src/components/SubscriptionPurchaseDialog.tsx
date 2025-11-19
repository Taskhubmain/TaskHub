import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';
import PriceDisplay from './PriceDisplay';

interface SubscriptionPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLANS = [
  {
    id: '1month',
    name: '1 месяц',
    priceUSD: 10,
    days: 30,
    badge: null,
  },
  {
    id: '3months',
    name: '3 месяца',
    priceUSD: 25,
    days: 90,
    badge: 'Популярный',
    savings: '17%',
  },
  {
    id: '1year',
    name: '1 год',
    priceUSD: 80,
    days: 365,
    badge: 'Выгодно',
    savings: '33%',
  },
];

export default function SubscriptionPurchaseDialog({
  isOpen,
  onClose,
  onSuccess,
}: SubscriptionPurchaseDialogProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('3months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!user) return;

    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    setError(null);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('Профиль не найден');
        setLoading(false);
        return;
      }

      if (profile.balance < plan.priceUSD) {
        setError(`Недостаточно средств на балансе. Необходимо: $${plan.priceUSD}`);
        setLoading(false);
        return;
      }

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - plan.priceUSD })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.days);

      const { error: subError } = await supabase
        .from('recommendations_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: selectedPlan,
          expires_at: expiresAt.toISOString(),
          price_paid: plan.priceUSD,
          is_active: true,
        });

      if (subError) throw subError;

      const { error: ledgerError } = await supabase
        .from('wallet_ledger')
        .insert({
          user_id: user.id,
          kind: 'purchase',
          status: 'completed',
          amount_minor: plan.priceUSD * 100,
          currency: 'USD',
          metadata: {
            plan_type: selectedPlan,
            days: plan.days,
            description: `Подписка на рекомендации заказов (${plan.name})`
          },
        });

      if (ledgerError) throw ledgerError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Ошибка при покупке подписки');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3F7F6E] to-[#2F6F5E] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Рекомендации заказов</h2>
              <p className="text-sm text-gray-500">AI-подбор заказов специально для вас</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-[#3F7F6E]/10 to-[#2F6F5E]/10 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">Что вы получаете:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#3F7F6E] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  AI анализирует ваши навыки, опыт, среднюю стоимость работ и рейтинг
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#3F7F6E] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Персональный подбор заказов с высокой вероятностью совпадения
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#3F7F6E] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Автоматическое обновление списка рекомендаций
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#3F7F6E] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Удаление недоступных заказов из рекомендаций
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Выберите план:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#3F7F6E] bg-[#3F7F6E]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      plan.badge === 'Популярный'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">{plan.name}</div>
                    <div className="text-2xl font-bold text-[#3F7F6E] mb-1">
                      ${plan.priceUSD}
                    </div>
                    {plan.savings && (
                      <div className="text-xs text-green-600 font-medium">
                        Экономия {plan.savings}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      ~${(plan.priceUSD / plan.days).toFixed(2)}/день
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Итого к оплате:</span>
              <span className="text-2xl font-bold text-[#3F7F6E]">
                ${selectedPlanData?.priceUSD || 0}
              </span>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full h-12 text-lg bg-[#3F7F6E] hover:bg-[#2F6F5E]"
              >
                {loading ? 'Обработка...' : 'Оплатить с баланса'}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-12"
                disabled={loading}
              >
                Отмена
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Средства будут списаны с вашего баланса. Подписка активируется сразу после оплаты.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
