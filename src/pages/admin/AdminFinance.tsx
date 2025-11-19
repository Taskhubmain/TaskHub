import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function AdminFinance() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [platformBalance, setPlatformBalance] = useState(0);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalEscrow: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    const { data: ledgerData } = await supabase
      .from('wallet_ledger')
      .select(`
        *,
        profile:user_id(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('balance');

    if (ledgerData) {
      setTransactions(ledgerData);

      const revenue = ledgerData
        .filter(t => t.entry_type === 'commission')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const escrow = ledgerData
        .filter(t => t.entry_type === 'escrow_hold')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const deposits = ledgerData
        .filter(t => t.entry_type === 'deposit')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const withdrawals = ledgerData
        .filter(t => t.entry_type === 'withdrawal')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      setStats({
        totalRevenue: revenue,
        totalEscrow: escrow,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals
      });
    }

    if (profilesData) {
      const totalBalance = profilesData.reduce((sum, p) => sum + Number(p.balance || 0), 0);
      setPlatformBalance(totalBalance);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Пополнение',
      withdrawal: 'Вывод',
      commission: 'Комиссия',
      escrow_hold: 'Холд escrow',
      escrow_release: 'Возврат escrow',
      deal_payment: 'Оплата сделки',
      refund: 'Возврат'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'text-green-600',
      withdrawal: 'text-red-600',
      commission: 'text-[#3F7F6E]',
      escrow_hold: 'text-yellow-600',
      escrow_release: 'text-blue-600',
      deal_payment: 'text-green-600',
      refund: 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen relative">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Скоро...</h2>
          <p className="text-gray-600">Эта функция находится в разработке</p>
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Финансовые операции</h1>
          <p className="text-[#3F7F6E] mt-2">Мониторинг всех транзакций и финансовой активности</p>
        </div>

        <Card className="border-[#6FE7C8]/20 shadow-md mb-6 bg-gradient-to-br from-[#6FE7C8]/10 to-[#3F7F6E]/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Сейчас на платформе</p>
                <p className="text-4xl font-bold text-[#3F7F6E]">${platformBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Общий баланс всех пользователей</p>
              </div>
              <div className="h-16 w-16 bg-[#6FE7C8]/30 rounded-full flex items-center justify-center">
                <Wallet className="h-8 w-8 text-[#3F7F6E]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Комиссии</p>
                <div className="h-10 w-10 bg-[#6FE7C8]/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#3F7F6E]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-[#3F7F6E] mt-1">Доход платформы</p>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Escrow</p>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalEscrow.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">Заблокировано</p>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Пополнения</p>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalDeposits.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Входящие</p>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Выводы</p>
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalWithdrawals.toFixed(2)}</p>
              <p className="text-xs text-red-600 mt-1">Исходящие</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#6FE7C8]/20 shadow-md">
          <CardHeader className="pb-4 border-b">
            <CardTitle>Последние транзакции</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Нет транзакций
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-left text-sm text-gray-600">
                        <th className="pb-4 pt-2 font-semibold">Дата</th>
                        <th className="pb-4 pt-2 font-semibold text-right">Сумма</th>
                        <th className="pb-4 pt-2 font-semibold">Тип</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions
                        .filter(tx => tx.entry_type === 'deposit' || tx.entry_type === 'withdrawal')
                        .map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 text-sm text-gray-600">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`font-semibold text-base ${tx.entry_type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.entry_type === 'deposit' ? '+' : '-'}${Math.abs(Number(tx.amount) / 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.entry_type)} bg-gray-50`}>
                              {getTypeLabel(tx.entry_type)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-3">
                  {transactions
                    .filter(tx => tx.entry_type === 'deposit' || tx.entry_type === 'withdrawal')
                    .map((tx) => (
                    <div key={tx.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:border-[#6FE7C8]/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
                        <span className={`font-semibold text-base ml-2 ${tx.entry_type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.entry_type === 'deposit' ? '+' : '-'}${Math.abs(Number(tx.amount) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(tx.entry_type)} bg-gray-50`}>
                          {getTypeLabel(tx.entry_type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
