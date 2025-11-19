import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('FREELANCER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email,
        password,
        name,
        role: role as 'CLIENT' | 'FREELANCER',
      });

      if (result.success) {
        window.location.hash = '/profile-completion';
      } else {
        setError(result.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="register"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background flex items-center justify-center py-10"
      >
        <div className="w-full max-w-md px-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Регистрация</h1>
                <p className="text-[#3F7F6E]">Создайте аккаунт на TaskHub</p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Имя</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11"
                      required
                      disabled={loading}
                      pattern="[A-Za-zА-Яа-яЁё\s\-]+"
                      title="Имя может содержать только буквы (латиница и кириллица), пробелы и дефисы"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Пароль (минимум 8 символов)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-11"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Подтвердите пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-11"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium">Я...</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-11 rounded-md border px-3 bg-background"
                    disabled={loading}
                  >
                    <option value="FREELANCER">Фрилансер</option>
                    <option value="CLIENT">Заказчик</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" required disabled={loading} />
                  <span>Я принимаю условия использования и политику конфиденциальности</span>
                </label>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>

                <OAuthButtons onError={setError} mode="register" />

                <div className="text-center text-sm text-[#3F7F6E]">
                  Уже есть аккаунт?{' '}
                  <a href="#/login" className="text-[#6FE7C8] hover:underline font-medium">
                    Войти
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
