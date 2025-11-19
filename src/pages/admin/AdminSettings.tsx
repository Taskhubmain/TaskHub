import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Percent, Lock, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function AdminSettings() {
  const { user } = useAuth();
  const [commissionRate, setCommissionRate] = useState('10.00');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadAdmins();

    // Real-time subscription for admin list
    const channel = supabase
      .channel('admin-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.ADMIN'
        },
        () => {
          loadAdmins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('*').single();
    if (data) {
      setCommissionRate(data.commission_rate.toString());
    }
  };

  const loadAdmins = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'ADMIN').order('created_at', { ascending: true });
    setAdmins(data || []);
  };

  const handleSaveCommission = async () => {
    setLoading(true);
    setMessage('');
    try {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        setMessage('Неверная ставка комиссии (0-100%)');
        return;
      }

      const { data: settings } = await supabase.from('admin_settings').select('id').single();

      if (settings) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            commission_rate: rate,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      }

      setMessage('Комиссия успешно обновлена');
    } catch (error: any) {
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (newPassword !== confirmPassword) {
        setMessage('Пароли не совпадают');
        return;
      }
      if (newPassword.length < 8) {
        setMessage('Пароль должен быть не менее 8 символов');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('Пароль успешно изменён');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setMessage('Введите email пользователя');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newAdminEmail.trim())
        .maybeSingle();

      if (selectError) {
        console.error('Error fetching profile:', selectError);
        setMessage('Ошибка при поиске пользователя: ' + selectError.message);
        setLoading(false);
        return;
      }

      if (!profile) {
        setMessage('Пользователь с таким email не найден');
        setLoading(false);
        return;
      }

      if (profile.role === 'ADMIN') {
        setMessage('Этот пользователь уже администратор');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'ADMIN' })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating role:', updateError);
        setMessage('Ошибка при обновлении роли: ' + updateError.message);
        setLoading(false);
        return;
      }

      setMessage('Администратор успешно добавлен');
      setNewAdminEmail('');
      await loadAdmins();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Вы уверены, что хотите удалить роль администратора?')) return;

    setLoading(true);
    setMessage('');
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'FREELANCER' })
        .eq('id', adminId);

      if (updateError) {
        console.error('Error removing admin:', updateError);
        setMessage('Ошибка при удалении администратора: ' + updateError.message);
        setLoading(false);
        return;
      }

      setMessage('Администратор успешно удалён');
      await loadAdmins();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setMessage('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
          <p className="text-[#3F7F6E] mt-2">Управление параметрами платформы</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.includes('успешно') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-[#3F7F6E]" />
                Комиссия платформы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Процентная ставка (%)
                </label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10.00"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveCommission} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Текущая ставка будет применена ко всем новым сделкам
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#3F7F6E]" />
                Изменить пароль
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                <Lock className="h-4 w-4 mr-2" />
                Изменить пароль
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#6FE7C8]/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-[#3F7F6E]" />
                Управление администраторами
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Добавить администратора
                </label>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Email пользователя"
                    className="flex-1"
                  />
                  <Button onClick={handleAddAdmin} disabled={loading}>
                    Добавить
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Текущие администраторы ({admins.length})</p>
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                      {admin.id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={loading}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
