import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function MyTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTasks();
    }
  }, [isAuthenticated, user]);

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await getSupabase()
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-[#3F7F6E] mb-4">Войдите в систему для просмотра ваших объявлений</p>
            <Button asChild>
              <a href="#/login">Войти</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="my-tasks"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Мои объявления</h1>
            <Button asChild>
              <a href="#/task/new">
                <Plus className="h-4 w-4 mr-2" />
                Создать объявление
              </a>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-[#3F7F6E]">Загрузка...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-[#3F7F6E] mb-4">У вас пока нет объявлений</p>
                <Button asChild>
                  <a href="#/task/new">Создать первое объявление</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base leading-6">{task.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{task.category}</Badge>
                        <Badge variant={task.status === 'active' ? 'default' : 'outline'}>
                          {task.status === 'active' ? 'Активно' : task.status === 'paused' ? 'На паузе' : 'Удалено'}
                        </Badge>
                        {task.delivery_days && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {task.delivery_days}д
                          </Badge>
                        )}
                        {task.is_boosted && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Продвинут
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 px-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(task.tags || []).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      <div className="text-sm text-[#3F7F6E] line-clamp-2 mb-3">{task.description}</div>
                      <div className="font-semibold">
                        {task.currency} {task.price}
                      </div>
                      <div className="text-xs text-[#3F7F6E] mt-2">
                        Создано: {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
