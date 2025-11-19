import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, CheckCircle, Send, Handshake, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FavoriteButton from '@/components/ui/FavoriteButton';
import PriceDisplay from '@/components/PriceDisplay';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  delivery_days: number;
  tags: string[];
  features: string[];
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  name: string;
  avatar_url: string | null;
  email: string;
}

export default function TaskDetailPage() {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProposal, setHasProposal] = useState(false);
  const [userProposal, setUserProposal] = useState<any>(null);
  const isOwner = user && task && user.id === task.user_id;

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    const taskId = window.location.hash.split('/').pop();
    if (!taskId) return;

    try {
      const supabase = getSupabase();
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError || !taskData) {
        console.error('Error loading task:', taskError);
        return;
      }

      setTask(taskData);

      const viewData: any = {
        task_id: taskId,
        user_id: user?.id || null,
      };

      if (!user) {
        viewData.ip_address = 'anonymous';
      }

      await supabase
        .from('task_views')
        .insert(viewData)
        .select()
        .maybeSingle();

      const { count: viewsCount } = await supabase
        .from('task_views')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId);

      await supabase
        .from('tasks')
        .update({ views_count: viewsCount || 0 })
        .eq('id', taskId);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, email')
        .eq('id', taskData.user_id)
        .maybeSingle();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      if (user) {
        const { data: existingProposal } = await supabase
          .from('proposals')
          .select('*')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProposal) {
          setHasProposal(true);
          setUserProposal(existingProposal);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-[#3F7F6E]">Загрузка...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Объявление не найдено</h2>
          <Button asChild><a href="#/market">Вернуться на биржу</a></Button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="task-detail"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3">{task.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{task.category}</Badge>
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <FavoriteButton itemId={task.id} itemType="task" />
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-3">
                    <div className="flex items-center gap-1 text-[#3F7F6E]">
                      <Clock className="h-4 w-4" />
                      <span>{task.delivery_days} дней</span>
                    </div>
                    <div className="text-xl font-bold text-[#6FE7C8]">
                      <PriceDisplay amount={task.price} fromCurrency={task.currency} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-[#3F7F6E] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>

                  {task.features && task.features.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Что входит</h3>
                      <div className="grid gap-2">
                        {task.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-[#6FE7C8] mt-0.5 flex-shrink-0" />
                            <span className="text-[#3F7F6E]">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4">
                    {profile && (
                      <Button asChild variant="outline">
                        <a href={`#/users/${task.user_id}`}>
                          <User className="h-4 w-4 mr-2" />
                          Профиль
                        </a>
                      </Button>
                    )}
                    {!isOwner && (
                      <>
                        {hasProposal ? (
                          <Button asChild variant="outline">
                            <a href="#/proposals">
                              <Send className="h-4 w-4 mr-2" />
                              Ваш отклик
                            </a>
                          </Button>
                        ) : (
                          <Button asChild>
                            <a href={`#/proposals/create?type=task&id=${task.id}`}>
                              <Send className="h-4 w-4 mr-2" />
                              Откликнуться
                            </a>
                          </Button>
                        )}
                        <Button asChild variant="outline">
                          <a href={`#/deal/open?type=task&id=${task.id}`}>
                            <Handshake className="h-4 w-4 mr-2" />
                            Открыть сделку
                          </a>
                        </Button>
                        {profile && (
                          <Button asChild variant="outline">
                            <a href={`#/messages?to=${profile.email}`}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Написать
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {profile && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Исполнитель</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                        <User className="h-6 w-6 text-[#3F7F6E]" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{profile?.name || 'Пользователь'}</div>
                      <div className="text-sm text-[#3F7F6E]">{profile?.email}</div>
                    </div>
                  </div>
                  {profile && (
                    <Button variant="secondary" className="w-full" asChild>
                      <a href={`#/messages?to=${profile.email}`}>Написать сообщение</a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Информация</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Опубликовано</span>
                    <span className="font-medium">{new Date(task.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Статус</span>
                    <Badge variant="secondary">{task.status === 'active' ? 'Активно' : task.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Цена</span>
                    <span className="font-semibold text-[#6FE7C8]">
                      <PriceDisplay amount={task.price} fromCurrency={task.currency} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Срок выполнения</span>
                    <span className="font-medium">{task.delivery_days} дней</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
