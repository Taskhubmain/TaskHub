import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string>('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    checkAuthProvider();
  }, [user]);

  const checkAuthProvider = async () => {
    if (!user) return;

    const supabase = getSupabase();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const provider = authUser.app_metadata?.provider;
      if (provider && provider !== 'email') {
        setIsOAuthUser(true);
        setOauthProvider(provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : provider);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isOAuthUser && !currentPassword) {
      setMessage({ type: 'error', text: 'Введите текущий пароль' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      if (!isOAuthUser && currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: currentPassword,
        });

        if (signInError) {
          setMessage({ type: 'error', text: 'Неверный текущий пароль' });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: isOAuthUser
            ? 'Пароль успешно установлен. Теперь вы можете входить по email'
            : 'Пароль успешно изменён'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Произошла ошибка при изменении пароля' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newEmail || !newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Введите корректный email' });
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'На новый email отправлено письмо для подтверждения' });
        setNewEmail('');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Произошла ошибка при изменении email' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-[#3F7F6E]">Войдите, чтобы изменить настройки безопасности</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      className="container mx-auto px-4 py-4 md:py-8 max-w-3xl"
    >
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Настройки безопасности</h1>
        <p className="text-sm md:text-base text-[#3F7F6E]">Управление паролем и email</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Lock className="h-5 w-5" />
              Изменить пароль
            </CardTitle>
            {isOAuthUser && (
              <CardDescription className="text-xs md:text-sm">
                Вы вошли через {oauthProvider}. Установите пароль для возможности входа по email.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {!isOAuthUser && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Текущий пароль
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Введите текущий пароль"
                    required
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isOAuthUser ? 'Установите пароль' : 'Новый пароль'}
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isOAuthUser ? 'Подтвердите пароль' : 'Подтвердите новый пароль'}
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isOAuthUser ? 'Повторите пароль' : 'Повторите новый пароль'}
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    {isOAuthUser ? 'Установить пароль' : 'Изменить пароль'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Mail className="h-5 w-5" />
              Изменить email
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Текущий email: <span className="font-medium">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Новый email
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@domain.com"
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Изменить email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Важная информация</p>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                  <li>После изменения email необходимо подтвердить его по ссылке из письма</li>
                  <li>Пароль должен содержать минимум 6 символов</li>
                  <li>Используйте надёжные уникальные пароли</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
