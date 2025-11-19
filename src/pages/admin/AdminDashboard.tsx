import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Briefcase, TrendingUp, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeUsers: number;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalRevenue: number;
  pendingReports: number;
  lastDealCreated: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    onlineUsers: 0,
    activeUsers: 0,
    totalDeals: 0,
    activeDeals: 0,
    completedDeals: 0,
    totalRevenue: 0,
    pendingReports: 0,
    lastDealCreated: null
  });
  const [dealsByStatus, setDealsByStatus] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [usersRes, onlineRes, activeUsersRes, dealsRes, revenueRes, reportsRes, dealStatusRes, activityRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_online', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('deals').select('id, status, created_at'),
      supabase.from('wallet_ledger').select('amount_minor').eq('kind', 'platform_commission'),
      supabase.from('moderation_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('deals').select('status'),
      supabase.from('deals').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(10)
    ]);

    const deals = dealsRes.data || [];
    const activeDeals = deals.filter(d => d.status === 'STARTED' || d.status === 'SUBMITTED' || d.status === 'REVISION_REQUESTED').length;
    const completedDeals = deals.filter(d => d.status === 'ACCEPTED' || d.status === 'RESOLVED').length;
    const lastDeal = deals.length > 0 ? deals[deals.length - 1].created_at : null;

    const totalRevenue = (revenueRes.data || []).reduce((sum, entry) => sum + Number(entry.amount_minor), 0);

    const statusCounts = (dealStatusRes.data || []).reduce((acc: any, deal) => {
      acc[deal.status] = (acc[deal.status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalUsers: usersRes.count || 0,
      onlineUsers: onlineRes.count || 0,
      activeUsers: activeUsersRes.count || 0,
      totalDeals: deals.length,
      activeDeals,
      completedDeals,
      totalRevenue: totalRevenue / 100,
      pendingReports: reportsRes.count || 0,
      lastDealCreated: lastDeal
    });

    setDealsByStatus(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));
    setRecentActivity(activityRes.data || []);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Нет данных';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'STARTED': 'bg-blue-100 text-blue-800',
      'SUBMITTED': 'bg-yellow-100 text-yellow-800',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'DISPUTED': 'bg-red-100 text-red-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CREATED': 'Создана',
      'STARTED': 'В работе',
      'SUBMITTED': 'На проверке',
      'REVISION_REQUESTED': 'Требуется доработка',
      'ACCEPTED': 'Принята',
      'DISPUTED': 'Спор',
      'RESOLVED': 'Решена',
      'CANCELLED': 'Отменена'
    };
    return labels[status] || status;
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
          <p className="text-[#3F7F6E] mt-2">Обзор ключевых метрик платформы</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#3F7F6E]">Всего пользователей</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Активных: {stats.activeUsers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#3F7F6E]">Онлайн сейчас</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.onlineUsers}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    В реальном времени
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#3F7F6E]">Всего сделок</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDeals}</p>
                  <p className="text-xs text-gray-500 mt-1">Активных: {stats.activeDeals}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#3F7F6E]">Доход (комиссии)</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-[#3F7F6E] mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    За всё время
                  </p>
                </div>
                <div className="h-12 w-12 bg-[#6FE7C8]/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#3F7F6E]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle>Статистика сделок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Активные сделки</p>
                      <p className="text-sm text-gray-600">В процессе выполнения</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeDeals}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Завершённые сделки</p>
                      <p className="text-sm text-gray-600">Успешно выполнены</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.completedDeals}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Жалобы на модерации</p>
                      <p className="text-sm text-gray-600">Требуют внимания</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Последняя сделка</p>
                      <p className="text-sm text-gray-600">Время создания</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">{formatDate(stats.lastDealCreated)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle>Последняя активность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Нет недавней активности</p>
                ) : (
                  recentActivity.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{deal.title || `Сделка #${deal.id.slice(0, 8)}`}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(deal.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                        {getStatusLabel(deal.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {dealsByStatus.length > 0 && (
          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle>Распределение сделок по статусам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dealsByStatus.map(({ status, count }) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-[#3F7F6E] mt-1">{getStatusLabel(status)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
