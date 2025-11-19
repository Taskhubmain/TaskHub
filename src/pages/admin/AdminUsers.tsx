import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Shield, Ban, CheckCircle, VolumeX, Volume2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'FREELANCER' | 'CLIENT'>('all');
  const [loading, setLoading] = useState(false);
  const [muteDialog, setMuteDialog] = useState<{ open: boolean; userId?: string; currentStatus?: boolean }>({ open: false });
  const [muteDuration, setMuteDuration] = useState<'1h' | '24h' | '7d' | 'permanent'>('24h');
  const [muteReason, setMuteReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      FREELANCER: 'bg-blue-100 text-blue-800',
      CLIENT: 'bg-green-100 text-green-800'
    };
    return variants[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Администратор',
      FREELANCER: 'Исполнитель',
      CLIENT: 'Заказчик'
    };
    return labels[role] || role;
  };

  const openMuteDialog = (userId: string, currentStatus: boolean) => {
    setMuteDialog({ open: true, userId, currentStatus });
    setMuteReason('');
    setMuteDuration('24h');
  };

  const handleMuteUser = async () => {
    if (!user || !muteDialog.userId) return;

    const newStatus = !muteDialog.currentStatus;
    let mutedUntil: string | null = null;

    if (newStatus && muteDuration !== 'permanent') {
      const now = new Date();
      if (muteDuration === '1h') {
        now.setHours(now.getHours() + 1);
      } else if (muteDuration === '24h') {
        now.setHours(now.getHours() + 24);
      } else if (muteDuration === '7d') {
        now.setDate(now.getDate() + 7);
      }
      mutedUntil = now.toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_muted: newStatus,
        muted_at: newStatus ? new Date().toISOString() : null,
        muted_by: newStatus ? user.id : null,
        muted_until: mutedUntil,
        mute_reason: newStatus ? muteReason || null : null,
      })
      .eq('id', muteDialog.userId);

    if (error) {
      alert('Ошибка при изменении статуса мьюта');
      return;
    }

    setMuteDialog({ open: false });
    await loadUsers();
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    if (!user) return;

    const newStatus = !currentBanStatus;
    const { error } = await supabase
      .from('profiles')
      .update({
        is_banned: newStatus,
        banned_at: newStatus ? new Date().toISOString() : null,
        banned_by: newStatus ? user.id : null,
      })
      .eq('id', userId);

    if (error) {
      alert('Ошибка при изменении статуса бана');
      return;
    }

    await loadUsers();
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-[#3F7F6E] mt-2">Просмотр и управление всеми пользователями платформы</p>
        </div>

        <Card className="border-[#6FE7C8]/20 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={roleFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('all')}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Все
                </Button>
                <Button
                  variant={roleFilter === 'ADMIN' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('ADMIN')}
                  size="sm"
                  className="min-w-[80px]"
                >
                  Админы
                </Button>
                <Button
                  variant={roleFilter === 'FREELANCER' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('FREELANCER')}
                  size="sm"
                  className="min-w-[100px]"
                >
                  Исполнители
                </Button>
                <Button
                  variant={roleFilter === 'CLIENT' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('CLIENT')}
                  size="sm"
                  className="min-w-[100px]"
                >
                  Заказчики
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {loading ? (
            <Card className="border-[#6FE7C8]/20">
              <CardContent className="p-8 text-center text-gray-500">
                Загрузка...
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-[#6FE7C8]/20">
              <CardContent className="p-8 text-center text-gray-500">
                Пользователи не найдены
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="border-[#6FE7C8]/20 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <div className="flex items-start gap-3 flex-1 w-full">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#6FE7C8] to-[#3F7F6E] flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</h3>
                          <span className={`px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          {user.is_online && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></span>
                              Онлайн
                            </span>
                          )}
                          {user.is_muted && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              <VolumeX className="h-3 w-3" />
                              Замьючен
                            </span>
                          )}
                          {user.is_banned && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-red-100 text-red-800">
                              <Ban className="h-3 w-3" />
                              Забанен
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                        {user.bio && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1 sm:line-clamp-2">{user.bio}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[10px] sm:text-xs text-gray-500">
                          <span className="truncate">Рег: {formatDate(user.created_at)}</span>
                          {user.rating && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-[#3F7F6E]" />
                              {user.rating}/5
                            </span>
                          )}
                          {user.balance !== undefined && user.balance !== null && (
                            <span className="font-medium text-[#3F7F6E]">
                              ${Number(user.balance).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.hash = `#/users/${user.id}`}
                        className="text-xs flex-1 sm:flex-initial min-w-[70px]"
                      >
                        Профиль
                      </Button>
                      <Button
                        variant={user.is_banned ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleBanUser(user.id, user.is_banned)}
                        className={`text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-[100px] sm:h-10 ${user.is_banned ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        title={user.is_banned ? 'Разбанить' : 'Забанить'}
                      >
                        <Ban className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{user.is_banned ? 'Разбанить' : 'Бан'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8">
          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle>Статистика пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-sm text-gray-600">Всего</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">
                    {users.filter(u => u.role === 'FREELANCER').length}
                  </p>
                  <p className="text-sm text-blue-600">Исполнители</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">
                    {users.filter(u => u.role === 'CLIENT').length}
                  </p>
                  <p className="text-sm text-green-600">Заказчики</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                  <p className="text-sm text-red-600">Админы</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={muteDialog.open} onOpenChange={(open) => setMuteDialog({ ...muteDialog, open })}>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {muteDialog.currentStatus ? 'Размьютить пользователя' : 'Замьютить пользователя'}
              </h2>
              <button
                onClick={() => setMuteDialog({ open: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!muteDialog.currentStatus && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Длительность
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={muteDuration === '1h' ? 'default' : 'outline'}
                      onClick={() => setMuteDuration('1h')}
                      className="w-full"
                    >
                      1 час
                    </Button>
                    <Button
                      variant={muteDuration === '24h' ? 'default' : 'outline'}
                      onClick={() => setMuteDuration('24h')}
                      className="w-full"
                    >
                      24 часа
                    </Button>
                    <Button
                      variant={muteDuration === '7d' ? 'default' : 'outline'}
                      onClick={() => setMuteDuration('7d')}
                      className="w-full"
                    >
                      7 дней
                    </Button>
                    <Button
                      variant={muteDuration === 'permanent' ? 'default' : 'outline'}
                      onClick={() => setMuteDuration('permanent')}
                      className="w-full"
                    >
                      Навсегда
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Причина (необязательно)
                  </label>
                  <Input
                    value={muteReason}
                    onChange={(e) => setMuteReason(e.target.value)}
                    placeholder="Укажите причину мьюта..."
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMuteDialog({ open: false })}
              >
                Отмена
              </Button>
              <Button
                onClick={handleMuteUser}
                className={muteDialog.currentStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {muteDialog.currentStatus ? 'Размьютить' : 'Замьютить'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </motion.div>
  );
}
