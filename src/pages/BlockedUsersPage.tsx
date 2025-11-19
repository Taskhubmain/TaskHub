import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
const pageTransition = { duration: 0.2 };

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function BlockedUsersPage() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBlockedUsers();
    }
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: blockedData } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      setBlockedUsers(blockedData || []);

      if (blockedData && blockedData.length > 0) {
        const userIds = blockedData.map(b => b.blocked_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        const profilesMap: Record<string, Profile> = {};
        (profilesData || []).forEach((p: Profile) => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      await loadBlockedUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Ошибка при разблокировке пользователя');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50"
    >
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Заблокированные пользователи</h1>
          <p className="text-gray-600 mt-2">
            Управляйте списком заблокированных пользователей
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Загрузка...</p>
            </CardContent>
          </Card>
        ) : blockedUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Нет заблокированных пользователей
              </h3>
              <p className="text-gray-600">
                Вы не заблокировали ни одного пользователя
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blocked) => {
              const profile = profiles[blocked.blocked_id];
              return (
                <Card key={blocked.id} className="hover:shadow-md transition">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#3F7F6E] text-white flex items-center justify-center font-semibold flex-shrink-0">
                          {profile?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {profile?.name || 'Неизвестный пользователь'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Заблокирован {formatDate(blocked.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blocked.id)}
                        className="hover:bg-[#EFFFF8] hover:text-[#3F7F6E] hover:border-[#3F7F6E] flex-shrink-0"
                      >
                        Разблокировать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
