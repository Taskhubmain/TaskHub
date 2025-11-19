import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function AdminDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    disputed: 0,
    totalValue: 0,
    totalCommission: 0
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    const { data: dealsData } = await supabase
      .from('deals')
      .select(`
        *,
        client:profiles!deals_client_id_fkey(name, email),
        freelancer:profiles!deals_freelancer_id_fkey(name, email),
        order:orders(title),
        task:tasks(title)
      `)
      .order('created_at', { ascending: false });

    if (dealsData) {
      setDeals(dealsData);

      const active = dealsData.filter(d => ['in_progress', 'pending_review'].includes(d.status)).length;
      const completed = dealsData.filter(d => ['completed'].includes(d.status)).length;
      const disputed = dealsData.filter(d => d.status === 'disputed').length;
      const totalValue = dealsData.reduce((sum, d) => sum + (d.price || 0), 0);

      const totalCommission = dealsData
        .filter(d => ['completed'].includes(d.status))
        .reduce((sum, d) => {
          const price = d.price || 0;
          const rate = d.is_boosted ? 0.25 : 0.15;
          return sum + (price * rate);
        }, 0);

      setStats({
        total: dealsData.length,
        active,
        completed,
        disputed,
        totalValue: totalValue / 100,
        totalCommission: totalCommission / 100
      });
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'revision_requested': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'disputed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Ожидает',
      'in_progress': 'В работе',
      'pending_review': 'На проверке',
      'revision_requested': 'Доработка',
      'completed': 'Завершена',
      'disputed': 'Спор',
      'cancelled': 'Отменена'
    };
    return labels[status] || status;
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background relative">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Скоро...</h2>
          <p className="text-gray-600">Эта функция находится в разработке</p>
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мониторинг сделок</h1>
          <p className="text-[#3F7F6E] mt-2">Отслеживание всех сделок на платформе</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Всего</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Активные</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Завершено</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Споры</p>
                  <p className="text-2xl font-bold text-red-900">{stats.disputed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#6FE7C8]/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#3F7F6E]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Объём</p>
                  <p className="text-xl font-bold text-[#3F7F6E]">${stats.totalValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Комиссия</p>
                  <p className="text-xl font-bold text-yellow-900">${stats.totalCommission.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#6FE7C8]/20 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>Все сделки</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="bg-opacity-90 hover:bg-opacity-100 min-w-[80px]"
                >
                  Все
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                  className="bg-opacity-90 hover:bg-opacity-100 min-w-[100px]"
                >
                  Активные
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                  className="bg-opacity-90 hover:bg-opacity-100 min-w-[120px]"
                >
                  Завершенные
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {deals.filter(deal => {
                if (filter === 'active') {
                  return ['STARTED', 'SUBMITTED', 'REVISION_REQUESTED'].includes(deal.status);
                }
                if (filter === 'completed') {
                  return ['ACCEPTED', 'RESOLVED'].includes(deal.status);
                }
                return true;
              }).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Нет сделок</p>
              ) : (
                deals.filter(deal => {
                  if (filter === 'active') {
                    return ['STARTED', 'SUBMITTED', 'REVISION_REQUESTED'].includes(deal.status);
                  }
                  if (filter === 'completed') {
                    return ['ACCEPTED', 'RESOLVED'].includes(deal.status);
                  }
                  return true;
                }).map((deal) => (
                  <div key={deal.id} className="p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {deal.title || deal.order?.title || deal.task?.title || `Сделка #${deal.id.slice(0, 8)}`}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                            {getStatusLabel(deal.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {deal.client && (
                            <span>Заказчик: {deal.client.name}</span>
                          )}
                          {deal.freelancer && (
                            <span>Исполнитель: {deal.freelancer.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#3F7F6E]">
                          ${(deal.price / 100).toFixed(2)}
                        </p>
                        {deal.is_boosted !== undefined && (
                          <p className="text-xs text-gray-600 mt-1">
                            Комиссия: {deal.is_boosted ? '25%' : '15%'}
                          </p>
                        )}
                        {deal.deadline && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(deal.deadline).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-3 pt-3 border-t">
                      <span>ID: {deal.id.slice(0, 8)}</span>
                      <span>Создана: {formatDate(deal.created_at)}</span>
                      {deal.updated_at && deal.updated_at !== deal.created_at && (
                        <span>Обновлена: {formatDate(deal.updated_at)}</span>
                      )}
                      {deal.escrow_amount && (
                        <span className="font-medium text-[#3F7F6E]">
                          Escrow: ${(deal.escrow_amount / 100).toFixed(2)}
                        </span>
                      )}
                      {deal.is_boosted && (
                        <span className="font-medium text-yellow-600">
                          С продвижением
                        </span>
                      )}
                      {['ACCEPTED', 'RESOLVED'].includes(deal.status) && deal.price && (
                        <span className="font-medium text-green-600">
                          Исполнителю: ${((deal.price / 100) * (deal.is_boosted ? 0.75 : 0.85)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
