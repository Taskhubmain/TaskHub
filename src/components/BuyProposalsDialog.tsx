import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from './PriceDisplay';

interface BuyProposalsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PACKAGES = [
  {
    id: 'pack_10',
    amount: 10,
    priceUSD: 5,
    badge: null,
  },
  {
    id: 'pack_25',
    amount: 25,
    priceUSD: 10,
    badge: 'Популярный',
    savings: '20%',
  },
  {
    id: 'pack_50',
    amount: 50,
    priceUSD: 18,
    badge: 'Выгодно',
    savings: '28%',
  },
  {
    id: 'pack_100',
    amount: 100,
    priceUSD: 30,
    badge: 'Лучшее предложение',
    savings: '40%',
  },
];

export default function BuyProposalsDialog({
  open,
  onClose,
  onSuccess,
}: BuyProposalsDialogProps) {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [selectedPackage, setSelectedPackage] = useState('pack_25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userCurrency, setUserCurrency] = useState('USD');

  useEffect(() => {
    if (open && user) {
      loadUserBalance();
    }
  }, [open, user]);

  const loadUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, currency')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserBalance(parseFloat(data.balance) || 0);
        setUserCurrency(data.currency || 'USD');
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user) return;

    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user has enough balance
      if (userBalance < pkg.priceUSD) {
        setError('Недостаточно средств на балансе. Пополните кошелек.');
        setLoading(false);
        return;
      }

      // Deduct from balance and add purchased proposals
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance, purchased_proposals')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        throw new Error('Не удалось загрузить данные профиля');
      }

      const currentBalance = parseFloat(profileData.balance);
      const currentPurchased = profileData.purchased_proposals || 0;

      if (currentBalance < pkg.priceUSD) {
        setError('Недостаточно средств на балансе. Пополните кошелек.');
        setLoading(false);
        return;
      }

      const newBalance = currentBalance - pkg.priceUSD;
      const newPurchased = currentPurchased + pkg.amount;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          purchased_proposals: newPurchased,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update wallets table to keep in sync
      await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Create wallet transaction in wallet_ledger
      await supabase
        .from('wallet_ledger')
        .insert({
          user_id: user.id,
          kind: 'purchase',
          status: 'completed',
          amount_minor: Math.round(-pkg.priceUSD * 100),
          currency: userCurrency.toLowerCase(),
          metadata: {
            package_id: pkg.id,
            proposals_amount: pkg.amount,
            description: `Покупка ${pkg.amount} откликов`,
          },
        });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Произошла ошибка при покупке');
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-[#3F7F6E]" />
            Купить дополнительные отклики
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Выберите пакет откликов. Оплата будет списана с вашего внутреннего баланса.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-[#EFFFF8] to-[#E0F7EE] rounded-lg border border-[#3F7F6E]/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#3F7F6E]" />
            <span className="text-xs sm:text-sm font-medium text-[#3F7F6E]">Ваш баланс</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#3F7F6E]">
            <PriceDisplay amount={userBalance} fromCurrency={userCurrency} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 sm:p-5 transition-all ${
                selectedPackage === pkg.id
                  ? 'border-[#3F7F6E] bg-[#EFFFF8] shadow-lg'
                  : 'border-gray-200 hover:border-[#3F7F6E]/50'
              }`}
            >
              {pkg.badge && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#6FE7C8] to-[#3F7F6E] text-white text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                  {pkg.badge}
                </div>
              )}

              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#3F7F6E]">{pkg.amount}</div>
                  <div className="text-xs sm:text-sm text-[#3F7F6E]/70">откликов</div>
                </div>
                {selectedPackage === pkg.id && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3F7F6E] rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-[#3F7F6E]/70">Стоимость</span>
                  <div className="text-base sm:text-lg font-bold text-[#3F7F6E]">
                    <PriceDisplay amount={pkg.priceUSD} fromCurrency="USD" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-[#3F7F6E]/70">За 1 отклик</span>
                  <div className="text-xs sm:text-sm text-[#3F7F6E]/70">
                    <PriceDisplay amount={pkg.priceUSD / pkg.amount} fromCurrency="USD" />
                  </div>
                </div>
                {pkg.savings && (
                  <div className="pt-1 sm:pt-2">
                    <span className="inline-block px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded">
                      Экономия {pkg.savings}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading || !selectedPkg}
            className="bg-[#3F7F6E] hover:bg-[#2F6F5E] w-full sm:w-auto"
          >
            {loading ? (
              'Обработка...'
            ) : (
              <span className="flex items-center gap-1.5">
                Купить за
                <PriceDisplay amount={selectedPkg?.priceUSD || 0} fromCurrency="USD" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
