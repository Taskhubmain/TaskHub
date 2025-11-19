import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ThumbsUp, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'under_review' | 'planned' | 'implemented'>('new');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [filter]);

  const loadSuggestions = async () => {
    let query = supabase
      .from('user_suggestions')
      .select(`
        *,
        user:user_id(name, email)
      `)
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setSuggestions(data || []);
  };

  const handleUpdateStatus = async (suggestionId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_suggestions')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      setAdminNotes('');
      loadSuggestions();
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
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      planned: 'bg-purple-100 text-purple-800',
      implemented: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Новое',
      under_review: 'На рассмотрении',
      planned: 'Запланировано',
      implemented: 'Реализовано',
      rejected: 'Отклонено'
    };
    return labels[status] || status;
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, string> = {
      feature: 'bg-green-100 text-green-800',
      improvement: 'bg-blue-100 text-blue-800',
      bug: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return variants[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      feature: 'Новая функция',
      improvement: 'Улучшение',
      bug: 'Баг',
      other: 'Другое'
    };
    return labels[category] || category;
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
          <h1 className="text-3xl font-bold text-gray-900">Предложения пользователей</h1>
          <p className="text-[#3F7F6E] mt-2">Управление идеями и обратной связью от пользователей</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Все
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            onClick={() => setFilter('new')}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Новые
          </Button>
          <Button
            variant={filter === 'under_review' ? 'default' : 'outline'}
            onClick={() => setFilter('under_review')}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            На рассмотрении
          </Button>
          <Button
            variant={filter === 'planned' ? 'default' : 'outline'}
            onClick={() => setFilter('planned')}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Запланированные
          </Button>
          <Button
            variant={filter === 'implemented' ? 'default' : 'outline'}
            onClick={() => setFilter('implemented')}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-4"
          >
            Реализованные
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <Card className="border-[#6FE7C8]/20">
                <CardContent className="p-8 text-center text-gray-500">
                  Нет предложений для отображения
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion) => (
                <Card
                  key={suggestion.id}
                  className={`border-[#6FE7C8]/20 shadow-md cursor-pointer transition-all ${
                    selectedSuggestion?.id === suggestion.id ? 'ring-2 ring-[#6FE7C8]' : 'hover:shadow-lg'
                  }`}
                  onClick={() => {
                    setSelectedSuggestion(suggestion);
                    setAdminNotes(suggestion.admin_notes || '');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{suggestion.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                          <ThumbsUp className="h-3 w-3" />
                          {suggestion.votes}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{suggestion.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(suggestion.status)}`}>
                        {getStatusLabel(suggestion.status)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryBadge(suggestion.category)}`}>
                        {getCategoryLabel(suggestion.category)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(suggestion.created_at)}</span>
                    </div>
                    {suggestion.user && (
                      <p className="text-xs text-gray-500 mt-2">
                        От: {suggestion.user.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedSuggestion ? (
              <Card className="border-[#6FE7C8]/20 shadow-md sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#3F7F6E]" />
                    Детали предложения
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedSuggestion.title}</h3>
                    <p className="text-sm text-gray-700">{selectedSuggestion.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedSuggestion.status)}`}>
                      {getStatusLabel(selectedSuggestion.status)}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryBadge(selectedSuggestion.category)}`}>
                      {getCategoryLabel(selectedSuggestion.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <ThumbsUp className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">{selectedSuggestion.votes} голосов</span>
                  </div>

                  {selectedSuggestion.user && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Автор предложения</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{selectedSuggestion.user.name}</p>
                        <p className="text-xs text-gray-500">{selectedSuggestion.user.email}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Дата создания</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedSuggestion.created_at)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Заметки администратора
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6FE7C8] focus:border-transparent"
                      rows={4}
                      placeholder="Добавьте комментарий или решение..."
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Изменить статус</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSuggestion.id, 'under_review')}
                        disabled={loading}
                      >
                        На рассмотрении
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSuggestion.id, 'planned')}
                        disabled={loading}
                      >
                        Запланировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSuggestion.id, 'implemented')}
                        disabled={loading}
                        className="text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Реализовано
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSuggestion.id, 'rejected')}
                        disabled={loading}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[#6FE7C8]/20 shadow-md">
                <CardContent className="p-8 text-center text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Выберите предложение для просмотра деталей</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
