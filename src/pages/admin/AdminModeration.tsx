import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reported_content_type: string;
  reported_content_id: string;
  reason: string;
  description: string;
  status: string;
  reviewed_by: string | null;
  resolution: string;
  created_at: string;
  reporter?: any;
  reported_user?: any;
}

export default function AdminModeration() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    let query = supabase
      .from('moderation_reports')
      .select(`
        *,
        reporter:reporter_id(id, name, email),
        reported_user:reported_user_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setReports(data || []);
  };

  const handleResolveReport = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('moderation_reports')
        .update({
          status: newStatus,
          reviewed_by: user?.id,
          resolution: resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      setResolution('');
      setSelectedReport(null);
      loadReports();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      reviewing: 'На рассмотрении',
      resolved: 'Решена',
      dismissed: 'Отклонена'
    };
    return labels[status] || status;
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order: 'Заказ',
      task: 'Объявление',
      message: 'Сообщение',
      review: 'Отзыв',
      profile: 'Профиль'
    };
    return labels[type] || type;
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
          <h1 className="text-3xl font-bold text-gray-900">Модерация и жалобы</h1>
          <p className="text-[#3F7F6E] mt-2">Управление жалобами пользователей и разрешение споров</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Все жалобы
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Ожидают
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            onClick={() => setFilter('resolved')}
          >
            Решённые
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {reports.length === 0 ? (
              <Card className="border-[#6FE7C8]/20">
                <CardContent className="p-8 text-center text-gray-500">
                  Нет жалоб для отображения
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card
                  key={report.id}
                  className={`border-[#6FE7C8]/20 shadow-md cursor-pointer transition-all ${
                    selectedReport?.id === report.id ? 'ring-2 ring-[#6FE7C8]' : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-gray-900">{report.reason}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Тип: {getContentTypeLabel(report.reported_content_type)}</span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                    {report.reporter && (
                      <p className="text-xs text-gray-500 mt-2">
                        От: {report.reporter.name} ({report.reporter.email})
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedReport ? (
              <Card className="border-[#6FE7C8]/20 shadow-md sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#3F7F6E]" />
                    Детали жалобы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Статус</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusBadge(selectedReport.status)}`}>
                      {getStatusLabel(selectedReport.status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Причина</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedReport.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Описание</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedReport.description}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Тип контента</p>
                    <p className="text-sm text-gray-900 mt-1">{getContentTypeLabel(selectedReport.reported_content_type)}</p>
                  </div>

                  {selectedReport.reporter && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Жалобу подал</p>
                      <div className="mt-1 p-2 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-900">{selectedReport.reporter.name}</p>
                        <p className="text-xs text-gray-500">{selectedReport.reporter.email}</p>
                      </div>
                    </div>
                  )}

                  {selectedReport.reported_user && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Пользователь на которого жалуются</p>
                      <div className="mt-1 p-2 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-900">{selectedReport.reported_user.name}</p>
                        <p className="text-xs text-gray-500">{selectedReport.reported_user.email}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700">Дата создания</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(selectedReport.created_at)}</p>
                  </div>

                  {selectedReport.resolution && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Решение</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedReport.resolution}</p>
                    </div>
                  )}

                  {selectedReport.status === 'pending' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ваше решение
                        </label>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6FE7C8] focus:border-transparent"
                          rows={4}
                          placeholder="Опишите принятое решение..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                          disabled={loading || !resolution}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Решить жалобу
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleResolveReport(selectedReport.id, 'dismissed')}
                          disabled={loading}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[#6FE7C8]/20 shadow-md">
                <CardContent className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Выберите жалобу для просмотра деталей</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
