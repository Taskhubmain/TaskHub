import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, MessageSquare, MapPin, AtSign, Link as LinkIcon, Clock, Image as ImageIcon, ExternalLink, Loader2, Eye, Calendar, Upload, X, Share2, Check, GraduationCap, Sparkles, Lock, Mail, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { MediaEditor } from '@/components/MediaEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateUserEmail } = useAuth();
  const supabase = getSupabase();
  const [tab, setTab] = useState('portfolio');

  useEffect(() => {
    if (tab === 'edit') {
      setEditSkills(profile.skills || []);
      setSkillInput('');
    }
  }, [tab]);
  const [showCopied, setShowCopied] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'order' | 'task' | 'portfolio'>('order');
  const [portfolioPreviewOpen, setPortfolioPreviewOpen] = useState(false);
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [statistics, setStatistics] = useState({
    rating: 0,
    completedProjects: 0,
    avgResponseTime: '',
    repeatOrders: 0
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [profile, setProfile] = useState(() => {
    const raw = typeof window !== 'undefined' && localStorage.getItem('fh_profile');
    return raw ? JSON.parse(raw) : {
      name: 'Mickey',
      headline: 'Web/Unity',
      role: 'Full‑stack / Game Dev',
      about: 'Full‑stack разработчик и Unity‑инженер. Люблю аккуратные интерфейсы и предсказуемый неткод.',
      bio: 'Занимаюсь разработкой уже более 5 лет. Специализируюсь на создании веб-приложений и игр. Работал над множеством проектов от стартапов до крупных корпораций. Всегда открыт к новым вызовам и интересным задачам. Предпочитаю чистый код и современные технологии.',
      skills: ['React', 'Tailwind', 'Node', 'PostgreSQL', 'Unity', 'Photon'],
      rateMin: 20,
      rateMax: 35,
      currency: 'USD',
      location: 'Есик / Алматы',
      contactEmail: 'you@example.com',
      contactTelegram: '@mickey',
      avatar: 'https://i.pravatar.cc/120?img=49'
    };
  });

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      loadTabData();
    }
  }, [tab]);

  const checkAuthProvider = async () => {
    if (!user) return;

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const provider = authUser.app_metadata?.provider;
      if (provider && provider !== 'email') {
        setIsOAuthUser(true);
        setOauthProvider(provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : provider);
      }
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadStatistics(),
        checkAuthProvider(),
      ]);
      await loadTabData();
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (tab === 'market' && userOrders.length === 0 && userTasks.length === 0) {
      setLoadingMarket(true);
      await loadUserMarketItems();
      setLoadingMarket(false);
    } else if (tab === 'portfolio' && portfolioProjects.length === 0) {
      await loadPortfolioProjects();
    } else if (tab === 'reviews' && reviews.length === 0) {
      await loadReviews();
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*, learning_completed')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        name: data.name || 'Пользователь',
        headline: data.headline || data.specialty || '',
        role: data.specialty || data.role || 'Фрилансер',
        about: data.about || '',
        bio: data.bio || '',
        skills: data.skills || [],
        rateMin: data.rate_min || 0,
        rateMax: data.rate_max || 0,
        currency: data.currency || 'USD',
        location: data.location || '',
        contactEmail: data.contact_gmail || data.email || '',
        contactTelegram: data.contact_telegram || '',
        avatar: data.avatar_url || 'https://i.pravatar.cc/120?img=49',
        experienceYears: data.experience_years || 0,
        age: data.age || null,
        learningCompleted: data.learning_completed || false,
        lastSeen: data.last_seen_at,
      });
    }
  };

  const loadStatistics = async () => {
    if (!user) return;

    

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', user.id);

    const avgRating = reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
      : 0;

    const { data: dealsData } = await supabase
      .from('deals')
      .select('id, status, client_id')
      .eq('freelancer_id', user.id)
      .eq('status', 'completed');

    const completedCount = dealsData?.length || 0;

    const clientIds = dealsData?.map(d => d.client_id) || [];
    const clientCounts = clientIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const repeatCount = Object.values(clientCounts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);

    const { data: proposalsData } = await supabase
      .from('proposals')
      .select('created_at, order_id, task_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    let avgResponseTimeStr = 'N/A';
    if (proposalsData && proposalsData.length > 0) {
      const responseTimes: number[] = [];

      for (const proposal of proposalsData) {
        let itemCreatedAt: string | null = null;

        if (proposal.order_id) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('created_at')
            .eq('id', proposal.order_id)
            .maybeSingle();
          itemCreatedAt = orderData?.created_at;
        } else if (proposal.task_id) {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('created_at')
            .eq('id', proposal.task_id)
            .maybeSingle();
          itemCreatedAt = taskData?.created_at;
        }

        if (itemCreatedAt) {
          const itemTime = new Date(itemCreatedAt).getTime();
          const proposalTime = new Date(proposal.created_at).getTime();
          const diffHours = (proposalTime - itemTime) / (1000 * 60 * 60);
          if (diffHours >= 0) {
            responseTimes.push(diffHours);
          }
        }
      }

      if (responseTimes.length > 0) {
        const avgHours = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
        if (avgHours < 1) {
          avgResponseTimeStr = `${Math.round(avgHours * 60)}м`;
        } else {
          avgResponseTimeStr = `${Math.round(avgHours)}ч`;
        }
      }
    }

    setStatistics({
      rating: Math.round(avgRating * 10) / 10,
      completedProjects: completedCount,
      avgResponseTime: avgResponseTimeStr,
      repeatOrders: repeatCount
    });
  };

  useEffect(() => {
    if (!user) return;

    

    const reviewsChannel = supabase
      .channel('user-reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `reviewee_id=eq.${user.id}`
        },
        () => {
          if (tab === 'reviews') {
            loadReviews();
          }
        }
      )
      .subscribe();

    return () => {
      reviewsChannel.unsubscribe();
    };
  }, [user, tab]);

  

  const loadUserMarketItems = async () => {
    if (!user) return;

    setLoadingMarket(true);
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setUserOrders(ordersData || []);
      setUserTasks(tasksData || []);
    } finally {
      setLoadingMarket(false);
    }
  };

  const loadPortfolioProjects = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setPortfolioProjects(data || []);
  };

  const loadReviews = async () => {
    if (!user) return;

    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = [...new Set(reviewsData.map((r: any) => r.reviewer_id))];
        const dealIds = [...new Set(reviewsData.map((r: any) => r.deal_id))];

        const [profilesResult, dealsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, name, avatar_url, email')
            .in('id', reviewerIds),
          supabase
            .from('deals')
            .select('id, task_id, order_id')
            .in('id', dealIds)
        ]);

        const profilesMap: Record<string, any> = {};
        (profilesResult.data || []).forEach((p: any) => {
          profilesMap[p.id] = p;
        });

        const dealsMap: Record<string, any> = {};
        (dealsResult.data || []).forEach((d: any) => {
          dealsMap[d.id] = d;
        });

        const taskIds = (dealsResult.data || []).filter((d: any) => d.task_id).map((d: any) => d.task_id);
        const orderIds = (dealsResult.data || []).filter((d: any) => d.order_id).map((d: any) => d.order_id);

        const [tasksResult, ordersResult] = await Promise.all([
          taskIds.length > 0 ? supabase.from('tasks').select('id, category').in('id', taskIds) : Promise.resolve({ data: [] }),
          orderIds.length > 0 ? supabase.from('orders').select('id, category').in('id', orderIds) : Promise.resolve({ data: [] })
        ]);

        const tasksMap: Record<string, any> = {};
        (tasksResult.data || []).forEach((t: any) => {
          tasksMap[t.id] = t;
        });

        const ordersMap: Record<string, any> = {};
        (ordersResult.data || []).forEach((o: any) => {
          ordersMap[o.id] = o;
        });

        const reviewsWithData = reviewsData.map((r: any) => {
          const deal = dealsMap[r.deal_id];
          let category = 'Без категории';
          if (deal) {
            if (deal.task_id && tasksMap[deal.task_id]) {
              category = tasksMap[deal.task_id].category || 'Без категории';
            } else if (deal.order_id && ordersMap[deal.order_id]) {
              category = ordersMap[deal.order_id].category || 'Без категории';
            }
          }

          return {
            ...r,
            reviewer_profile: profilesMap[r.reviewer_id] || { name: 'Пользователь', avatar_url: null, email: '' },
            category
          };
        });

        setReviews(reviewsWithData);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const handlePortfolioProjectClick = (project: any) => {
    setSelectedPortfolioProject(project);
    setPortfolioPreviewOpen(true);
  };

  const toggleHelpful = async (reviewId: string) => {
    if (!user) {
      alert('Необходимо войти в систему');
      return;
    }

    const newVotes = new Set(helpfulVotes);
    if (newVotes.has(reviewId)) {
      newVotes.delete(reviewId);
      await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);
    } else {
      newVotes.add(reviewId);
      await supabase
        .from('review_helpful_votes')
        .insert({
          review_id: reviewId,
          user_id: user.id
        });
    }
    setHelpfulVotes(newVotes);
    await loadReviews();
  };

  const openPreview = (item: any, type: 'order' | 'task') => {
    setPreviewItem(item);
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const saveProfile = (p: typeof profile) => {
    setProfile(p);
    if (typeof window !== 'undefined') localStorage.setItem('fh_profile', JSON.stringify(p));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5 МБ');
        return;
      }
      if (file.type.startsWith('image/')) {
        setFileToEdit(file);
        setShowMediaEditor(true);
      } else {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMediaSave = (editedFile: File) => {
    setAvatarFile(editedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(editedFile);
    setShowMediaEditor(false);
    setFileToEdit(null);
  };

  const handleMediaCancel = () => {
    setShowMediaEditor(false);
    setFileToEdit(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const onEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bioText = String(fd.get('bio') || '');
    if (bioText.length > 700) {
      alert('Текст "О себе" не должен превышать 700 символов');
      return;
    }

    let uploadedAvatarUrl = String(fd.get('avatar') || '');

    if (avatarFile && user) {
      try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-avatar-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await getSupabase().storage
          .from('portfolio-images')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`Ошибка при загрузке аватара: ${uploadError.message}`);
          return;
        }

        const { data: { publicUrl } } = getSupabase().storage
          .from('portfolio-images')
          .getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl;
        setAvatarFile(null);
        setAvatarPreview('');
      } catch (error: any) {
        console.error('Avatar upload error:', error);
        alert(`Ошибка при загрузке аватара: ${error.message}`);
        return;
      }
    }

    if (editSkills.length > 10) {
      alert('Максимум 10 навыков');
      return;
    }

    const next = {
      name: String(fd.get('name') || ''),
      headline: profile.headline,
      role: String(fd.get('role') || ''),
      about: profile.about,
      bio: bioText,
      skills: editSkills,
      rateMin: Math.min(Number(fd.get('rateMin') || 0), 1000),
      rateMax: Math.min(Number(fd.get('rateMax') || 0), 1000),
      currency: String(fd.get('currency') || 'USD'),
      location: String(fd.get('location') || ''),
      contactEmail: String(fd.get('contactEmail') || ''),
      contactTelegram: String(fd.get('contactTelegram') || ''),
      avatar: uploadedAvatarUrl
    };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: next.name,
          specialty: next.role,
          bio: next.bio,
          skills: next.skills,
          rate_min: next.rateMin,
          rate_max: next.rateMax,
          currency: next.currency,
          location: next.location,
          contact_gmail: next.contactEmail,
          contact_telegram: next.contactTelegram,
          avatar_url: next.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        alert(`Ошибка при обновлении профиля: ${updateError.message}`);
        return;
      }

      saveProfile(next);
      alert('Профиль обновлён');
      setTab('about');
    } catch (error: any) {
      console.error('Profile update error:', error);
      alert(`Ошибка при обновлении профиля: ${error.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (!isOAuthUser && !currentPassword) {
      setSecurityMessage({ type: 'error', text: 'Введите текущий пароль' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }

    setSecurityLoading(true);

    try {
      

      if (!isOAuthUser && currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: currentPassword,
        });

        if (signInError) {
          setSecurityMessage({ type: 'error', text: 'Неверный текущий пароль' });
          setSecurityLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setSecurityMessage({ type: 'error', text: error.message });
      } else {
        setSecurityMessage({
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
      setSecurityMessage({ type: 'error', text: 'Произошла ошибка при изменении пароля' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setSecurityMessage({ type: 'error', text: 'Введите корректный email адрес' });
      return;
    }

    if (newEmail === user?.email) {
      setSecurityMessage({ type: 'error', text: 'Новый email совпадает с текущим' });
      return;
    }

    setSecurityLoading(true);

    try {
      console.log('Attempting to update email from', user?.email, 'to', newEmail);

      const { data, error } = await supabase.rpc('update_user_email', {
        user_id: user!.id,
        new_email: newEmail
      });

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Email update error:', error);
        setSecurityMessage({ type: 'error', text: `Ошибка: ${error.message}` });
      } else if (data && typeof data === 'object' && 'error' in data) {
        const errorMsg = (data as any).error;
        if (errorMsg.includes('already in use')) {
          setSecurityMessage({ type: 'error', text: 'Этот email уже используется другим пользователем' });
        } else if (errorMsg.includes('only update your own')) {
          setSecurityMessage({ type: 'error', text: 'Ошибка авторизации' });
        } else {
          setSecurityMessage({ type: 'error', text: `Ошибка: ${errorMsg}` });
        }
      } else {
        updateUserEmail(newEmail);

        setSecurityMessage({
          type: 'success',
          text: 'Email успешно обновлён!'
        });
        setNewEmail('');
      }
    } catch (error: any) {
      console.error('Email update exception:', error);
      setSecurityMessage({ type: 'error', text: 'Произошла ошибка при изменении email' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;

    const profileUrl = `${window.location.origin}/#/users/${user.id}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6FE7C8] mx-auto mb-4" />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
            <div className="grid gap-4 lg:gap-6 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardContent className="p-4 lg:p-6 grid gap-3 lg:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={profile.avatar} alt="avatar" className="h-12 w-12 lg:h-16 lg:w-16 rounded-2xl object-cover" />
                      {profile.learningCompleted && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-lg" title="Прошел обучение">
                          <GraduationCap className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm lg:text-base truncate">{profile.name} • {profile.headline}</div>
                      <div className="text-xs lg:text-sm text-[#3F7F6E] truncate">{profile.role}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border p-2">
                      <div className="text-[10px] lg:text-xs text-[#3F7F6E]">Рейтинг</div>
                      <div className="font-semibold text-xs lg:text-sm flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 lg:h-4 lg:w-4" />
                        {statistics.rating > 0 ? statistics.rating.toFixed(1) : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-[10px] lg:text-xs text-[#3F7F6E]">Проекты</div>
                      <div className="font-semibold text-xs lg:text-sm">{statistics.completedProjects}</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-[10px] lg:text-xs text-[#3F7F6E]">Онлайн</div>
                      <div className="font-semibold text-xs lg:text-sm text-emerald-600">
                        {(() => {
                          if (!profile.lastSeen) return 'давно';
                          const now = Date.now();
                          const lastSeen = new Date(profile.lastSeen).getTime();
                          const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
                          if (diffMinutes < 5) return 'сейчас';
                          if (diffMinutes < 60) return `${diffMinutes}м назад`;
                          const diffHours = Math.floor(diffMinutes / 60);
                          if (diffHours < 24) return `${diffHours}ч назад`;
                          const diffDays = Math.floor(diffHours / 24);
                          return `${diffDays}д назад`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button asChild size="sm" className="h-9 text-sm"><a href="#/task/new">Создать Task</a></Button>
                    <Button asChild variant="secondary" size="sm" className="h-9 text-sm"><a href="#/order/new">Создать заказ</a></Button>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm text-[#3F7F6E]">
                    <div className="relative">
                      <button
                        className="flex items-center gap-1 underline hover:text-[#2F6F5E] transition-colors"
                        onClick={handleShareProfile}
                      >
                        <Share2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        <span className="hidden xs-375:inline">Поделиться</span>
                        <span className="xs-375:hidden">Поделиться</span>
                      </button>
                      <AnimatePresence>
                        {showCopied && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 top-full mt-2 bg-[#3F7F6E] text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm whitespace-nowrap z-10"
                          >
                            <Check className="h-4 w-4" />
                            Скопировано
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button className="underline" onClick={() => setTab('edit')}>Редактировать</button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#EFFFF8] to-white border-[#6FE7C8]/30 hidden lg:block">
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-[#6FE7C8] flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">Советы фрилансеру</h3>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="h-6 w-6 rounded-full bg-[#6FE7C8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-[#3F7F6E]">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-medium">Пополните портфолио</span> — добавьте минимум 3 проекта, чтобы увеличить доверие клиентов
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="h-6 w-6 rounded-full bg-[#6FE7C8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-[#3F7F6E]">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-medium">Быстро отвечайте</span> — ответ в течение часа повышает шансы получить заказ на 40%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="h-6 w-6 rounded-full bg-[#6FE7C8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-[#3F7F6E]">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-medium">Обновляйте профиль</span> — детальное описание и актуальные навыки привлекают больше клиентов
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="h-6 w-6 rounded-full bg-[#6FE7C8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-[#3F7F6E]">4</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-medium">Собирайте отзывы</span> — попросите клиентов оставить отзыв после завершения проекта
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-3 border-t border-[#6FE7C8]/20">
                    <p className="text-xs text-[#3F7F6E] text-center">
                      Следуйте этим советам, чтобы получать больше заказов
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:gap-6">
              <Card>
                <CardContent className="p-3 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 lg:flex-1">
                      {[{ id: 'portfolio', label: 'Портфолио' }, { id: 'market', label: 'Биржа' }, { id: 'about', label: 'О себе' }, { id: 'reviews', label: 'Отзывы' }, { id: 'settings', label: 'Настройки' }].map(t => (
                        <Button
                          key={t.id}
                          variant={tab === t.id ? 'default' : 'ghost'}
                          onClick={() => setTab(t.id)}
                          className="h-8 lg:h-9 px-3 lg:px-4 text-xs lg:text-sm flex-1 lg:flex-none min-w-0"
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="border-[#3F7F6E] text-[#3F7F6E] hover:bg-[#3F7F6E]/5 h-8 lg:h-9 px-3 lg:px-4 text-xs lg:text-sm w-full lg:w-auto">
                      <a href="#/recommendations" className="flex items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        Рекомендации заказов
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="relative">
                <AnimatePresence initial={false} mode="wait">
                  {tab === 'portfolio' && (
                    <motion.div
                      key="portfolio"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                <>
                  <div className="flex items-center justify-between mb-2 lg:mb-4">
                    <h2 className="text-xl lg:text-2xl font-bold">Портфолио</h2>
                    <Button asChild size="sm" className="h-8 lg:h-9 text-xs lg:text-sm">
                      <a href="#/me/portfolio/add">+ Добавить</a>
                    </Button>
                  </div>
                  {portfolioProjects.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-[#3F7F6E] mb-4">У вас пока нет проектов в портфолио</p>
                        <Button asChild>
                          <a href="#/me/portfolio/add">Добавить первый проект</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {portfolioProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <Card
                            className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                            onClick={() => handlePortfolioProjectClick(project)}
                          >
                          {project.image_url ? (
                            <img src={project.image_url} alt={project.title} className="aspect-[16/10] object-cover" />
                          ) : (
                            <div className="aspect-[16/10] bg-gradient-to-br from-[#EFFFF8] to-[#6FE7C8]/20 flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-[#3F7F6E]/30" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="font-medium mb-1">{project.title}</div>
                            <p className="text-sm text-[#3F7F6E] mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {project.tags?.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                              {project.tags?.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{project.tags.length - 3}</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
                  </motion.div>
                )}

                  {tab === 'market' && (
                    <motion.div
                      key="market"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                <>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Мои заказы</h2>
                    {loadingMarket ? (
                      <Card>
                        <CardContent className="p-8 lg:p-12 text-center">
                          <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-[#6FE7C8] mx-auto mb-3" />
                          <p className="text-sm lg:text-base text-[#3F7F6E]">Загрузка...</p>
                        </CardContent>
                      </Card>
                    ) : userOrders.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center text-sm lg:text-base text-[#3F7F6E]">
                          Вы ещё не создали ни одного заказа
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:gap-4">
                        {userOrders.map((order, index) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <Card className="cursor-pointer hover:shadow-lg hover:border-[#6FE7C8]/50 transition-all duration-300 hover:scale-[1.01]" onClick={() => openPreview(order, 'order')}>
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-6">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base lg:text-lg mb-2">{order.title}</h4>
                                  <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                    <Badge variant="secondary" className="text-xs">{order.category}</Badge>
                                    <Badge variant="outline" className="text-xs">{order.status}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-2 lg:mb-3">
                                    {(order.tags || []).map((t: string) => (
                                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                    ))}
                                  </div>
                                  <p className="text-xs lg:text-sm text-[#3F7F6E] mb-2 lg:mb-3 line-clamp-2">{order.description}</p>
                                  <div className="font-semibold text-sm lg:text-base text-[#6FE7C8]">
                                    {order.currency} {order.price_min}–{order.price_max}
                                  </div>
                                </div>
                                <div className="flex lg:flex-col items-center lg:items-end gap-3 lg:gap-2 text-xs lg:text-sm text-[#3F7F6E] lg:min-w-[140px]">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{order.views_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Heart className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{order.likes_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">Мои объявления</h2>
                    {loadingMarket ? (
                      <Card>
                        <CardContent className="p-8 lg:p-12 text-center">
                          <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-[#6FE7C8] mx-auto mb-3" />
                          <p className="text-sm lg:text-base text-[#3F7F6E]">Загрузка...</p>
                        </CardContent>
                      </Card>
                    ) : userTasks.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center text-sm lg:text-base text-[#3F7F6E]">
                          Вы ещё не создали ни одного объявления
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:gap-4">
                        {userTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <Card className="cursor-pointer hover:shadow-lg hover:border-[#6FE7C8]/50 transition-all duration-300 hover:scale-[1.01]" onClick={() => openPreview(task, 'task')}>
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-6">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base lg:text-lg mb-2">{task.title}</h4>
                                  <div className="flex items-center gap-2 mb-2 lg:mb-3 flex-wrap">
                                    <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                                    <Badge variant="outline" className="text-xs">{task.status}</Badge>
                                    {task.delivery_days && (
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" /> {task.delivery_days}д
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-2 lg:mb-3">
                                    {(task.tags || []).map((t: string) => (
                                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                    ))}
                                  </div>
                                  <p className="text-xs lg:text-sm text-[#3F7F6E] mb-2 lg:mb-3 line-clamp-2">{task.description}</p>
                                  <div className="font-semibold text-sm lg:text-base text-[#6FE7C8]">
                                    {task.currency} {task.price}
                                  </div>
                                </div>
                                <div className="flex lg:flex-col items-center lg:items-end gap-3 lg:gap-2 text-xs lg:text-sm text-[#3F7F6E] lg:min-w-[140px]">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{new Date(task.created_at).toLocaleDateString('ru-RU')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{task.views_count || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Heart className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                    <span>{task.likes_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
                  </motion.div>
                )}

                  {tab === 'about' && (
                    <motion.div
                      key="about"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                <div className="grid gap-4 lg:gap-6">
                  <Card>
                    <CardHeader className="p-4 lg:p-6">
                      <CardTitle className="text-xl lg:text-2xl">О фрилансере</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6 pt-0 grid gap-4 lg:gap-6">
                      <div>
                        <h3 className="font-semibold text-base lg:text-lg mb-2">{profile.headline}</h3>
                        <p className="text-sm lg:text-base text-[#3F7F6E] leading-relaxed mb-3 lg:mb-4">{profile.about}</p>
                        {profile.bio && (
                          <div className="mt-3 lg:mt-4 p-3 lg:p-4 rounded-xl bg-gradient-to-br from-[#EFFFF8] to-white border">
                            <h4 className="font-medium mb-2 text-xs lg:text-sm text-[#3F7F6E]">Подробнее обо мне</h4>
                            <p className="text-xs lg:text-sm leading-relaxed">{profile.bio}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                        <div className="rounded-xl border p-3 lg:p-4 bg-gradient-to-br from-[#EFFFF8] to-white">
                          <div className="text-xs lg:text-sm text-[#3F7F6E] mb-1">Специальность</div>
                          <div className="font-semibold text-xs lg:text-base truncate">{profile.role}</div>
                        </div>
                        <div className="rounded-xl border p-3 lg:p-4 bg-gradient-to-br from-[#EFFFF8] to-white">
                          <div className="text-xs lg:text-sm text-[#3F7F6E] mb-1">Опыт работы</div>
                          <div className="font-semibold text-xs lg:text-base">
                            {profile.experienceYears ? `${profile.experienceYears} ${profile.experienceYears === 1 ? 'год' : profile.experienceYears < 5 ? 'года' : 'лет'}` : 'Не указано'}
                          </div>
                        </div>
                        <div className="rounded-xl border p-3 lg:p-4 bg-gradient-to-br from-[#EFFFF8] to-white">
                          <div className="text-xs lg:text-sm text-[#3F7F6E] mb-1">Возраст</div>
                          <div className="font-semibold text-xs lg:text-base">
                            {profile.age ? `${profile.age} ${profile.age === 1 ? 'год' : profile.age < 5 || profile.age > 20 ? (profile.age % 10 === 1 && profile.age !== 11 ? 'год' : profile.age % 10 >= 2 && profile.age % 10 <= 4 && (profile.age < 10 || profile.age > 20) ? 'года' : 'лет') : 'лет'}` : 'Не указано'}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border p-4 lg:p-6">
                        <h4 className="font-semibold text-sm lg:text-base mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4 lg:h-5 lg:w-5 text-[#6FE7C8]" />
                          Рейтинг и статистика
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                          <div>
                            <div className="text-xs lg:text-sm text-[#3F7F6E]">Общий рейтинг</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-xl lg:text-2xl font-bold text-[#6FE7C8]">
                                {statistics.rating > 0 ? statistics.rating.toFixed(1) : 'N/A'}
                              </div>
                              <div className="flex">
                                {[1,2,3,4,5].map(i => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 lg:h-4 lg:w-4 ${
                                      i <= Math.floor(statistics.rating)
                                        ? 'fill-[#6FE7C8] text-[#6FE7C8]'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs lg:text-sm text-[#3F7F6E]">Завершено проектов</div>
                            <div className="text-xl lg:text-2xl font-bold mt-1">{statistics.completedProjects}</div>
                          </div>
                          <div>
                            <div className="text-xs lg:text-sm text-[#3F7F6E]">Среднее время отклика</div>
                            <div className="text-xl lg:text-2xl font-bold mt-1 text-emerald-600">{statistics.avgResponseTime}</div>
                          </div>
                          <div>
                            <div className="text-xs lg:text-sm text-[#3F7F6E]">Повторных заказов</div>
                            <div className="text-xl lg:text-2xl font-bold mt-1">{statistics.repeatOrders}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border p-4 lg:p-6">
                        <h4 className="font-semibold text-sm lg:text-base mb-3">Стоимость работ</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl lg:text-3xl font-bold text-[#6FE7C8]">${profile.rateMin}–${profile.rateMax}</span>
                          <span className="text-xs lg:text-base text-[#3F7F6E]">/ час</span>
                        </div>
                        <p className="text-xs lg:text-sm text-[#3F7F6E] mt-2">Итоговая стоимость зависит от сложности и объёма проекта</p>
                      </div>

                      <div className="rounded-xl border p-4 lg:p-6">
                        <h4 className="font-semibold text-sm lg:text-base mb-3 lg:mb-4">Навыки и технологии</h4>
                        <div className="flex flex-wrap gap-1.5 lg:gap-2">
                          {profile.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border p-6">
                        <h4 className="font-semibold mb-4">Контактная информация</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-[#6FE7C8]" />
                            </div>
                            <div>
                              <div className="text-xs text-[#3F7F6E]">Локация</div>
                              <div className="font-medium">{profile.location}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                              <AtSign className="h-5 w-5 text-[#6FE7C8]" />
                            </div>
                            <div>
                              <div className="text-xs text-[#3F7F6E]">Telegram</div>
                              <div className="font-medium">{profile.contactTelegram}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                              <LinkIcon className="h-5 w-5 text-[#6FE7C8]" />
                            </div>
                            <div>
                              <div className="text-xs text-[#3F7F6E]">Email</div>
                              <div className="font-medium">{profile.contactEmail}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                  </motion.div>
                )}

                  {tab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                <div className="grid gap-6">
                  <h2 className="text-2xl font-bold">Отзывы клиентов</h2>
                  {reviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Отзывов пока нет</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Завершите сделку, чтобы заказчик мог оставить отзыв
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews.map((review, index) => {
                        const reviewerName = review.reviewer_profile?.name || review.reviewer_profile?.email || 'Заказчик';

                        return (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                          >
                          <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                            <CardContent className="p-6 grid gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="font-medium">{reviewerName}</div>
                                  <div className="text-xs text-[#3F7F6E]">
                                    {new Date(review.created_at).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{review.category}</Badge>
                                  <div className="flex items-center gap-1 text-emerald-600">
                                    <Star className="h-4 w-4 fill-emerald-600" />
                                    <span className="font-semibold">{review.rating}.0</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-[#3F7F6E] leading-relaxed">
                                {review.comment}
                              </p>
                            </CardContent>
                          </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
                  </motion.div>
                )}

                  {tab === 'edit' && (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                <Card>
                  <CardContent className="p-6">
                    <form className="grid gap-4" onSubmit={onEditSubmit}>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Фото профиля</label>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        {!avatarPreview ? (
                          <div className="flex items-center gap-4">
                            {profile.avatar && (
                              <img
                                src={profile.avatar}
                                alt="Current avatar"
                                onClick={() => avatarInputRef.current?.click()}
                                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => avatarInputRef.current?.click()}
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Загрузить новое фото
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              onClick={() => avatarInputRef.current?.click()}
                              className="h-24 w-24 rounded-full object-cover border-2 border-[#6FE7C8] cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => avatarInputRef.current?.click()}
                              >
                                Изменить
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleRemoveAvatar}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-[#3F7F6E] mt-2">
                          PNG, JPG, GIF до 5 МБ. Рекомендуемый размер: 400x400 пикселей
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Имя</span>
                          <Input name="name" defaultValue={profile.name} className="h-11" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Специальность</span>
                          <Input name="role" defaultValue={profile.role} className="h-11" />
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <span className="text-sm font-medium">О себе (до 700 символов)</span>
                        <textarea
                          name="bio"
                          defaultValue={profile.bio || ''}
                          rows={6}
                          maxLength={700}
                          className="rounded-md border px-3 py-2 bg-background"
                          placeholder="Расскажите подробнее о своём опыте, навыках и интересах..."
                        />
                        <div className="text-xs text-[#3F7F6E] text-right">
                          {profile.bio?.length || 0} / 700
                        </div>
                      </label>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">
                          Навыки (максимум 10)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (skillInput.trim() && !editSkills.includes(skillInput.trim())) {
                                  if (editSkills.length >= 10) {
                                    alert('Максимум 10 навыков');
                                    return;
                                  }
                                  setEditSkills([...editSkills, skillInput.trim()]);
                                  setSkillInput('');
                                }
                              }
                            }}
                            placeholder="Добавьте навык"
                            className="h-11"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (skillInput.trim() && !editSkills.includes(skillInput.trim())) {
                                if (editSkills.length >= 10) {
                                  alert('Максимум 10 навыков');
                                  return;
                                }
                                setEditSkills([...editSkills, skillInput.trim()]);
                                setSkillInput('');
                              }
                            }}
                            disabled={editSkills.length >= 10}
                            className="whitespace-nowrap"
                          >
                            Добавить
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-[#3F7F6E]/10 text-[#3F7F6E] rounded-full text-sm"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => setEditSkills(editSkills.filter((s) => s !== skill))}
                                className="hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                        {editSkills.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {editSkills.length} / 10 навыков
                          </p>
                        )}
                        <input type="hidden" name="skills" value={editSkills.join(', ')} />
                      </div>
                      <div className="grid grid-cols-1 xs-414:grid-cols-2 sm:grid-cols-3 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Ставка min ($)</span>
                          <Input type="number" name="rateMin" defaultValue={profile.rateMin} className="h-11" min="0" max="1000" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Ставка max ($)</span>
                          <Input type="number" name="rateMax" defaultValue={profile.rateMax} className="h-11" min="0" max="1000" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Валюта</span>
                          <select name="currency" defaultValue={profile.currency} className="h-11 rounded-md border px-3 bg-background">
                            <option>USD</option>
                            <option>EUR</option>
                            <option>KZT</option>
                            <option>RUB</option>
                            <option>PLN</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Локация</span>
                          <Input name="location" defaultValue={profile.location} className="h-11" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Email</span>
                          <Input name="contactEmail" type="email" defaultValue={profile.contactEmail} className="h-11" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Telegram</span>
                          <Input name="contactTelegram" defaultValue={profile.contactTelegram} className="h-11" />
                        </label>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setTab('about')}>Отмена</Button>
                        <Button type="submit">Сохранить</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                    </motion.div>
                  )}

                  {tab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {securityMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`mb-4 p-3 lg:p-4 rounded-lg flex items-start gap-3 ${
                            securityMessage.type === 'success'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          {securityMessage.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <p className={`text-sm ${securityMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {securityMessage.text}
                          </p>
                        </motion.div>
                      )}

                      <div className="space-y-4 lg:space-y-6">
                        <Card>
                          <CardHeader className="p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                              <Lock className="h-5 w-5" />
                              Изменить пароль
                            </CardTitle>
                            {isOAuthUser && (
                              <CardDescription className="text-xs lg:text-sm mt-2">
                                Вы вошли через {oauthProvider}. Установите пароль для возможности входа по email.
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
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

                              <Button type="submit" disabled={securityLoading} className="w-full sm:w-auto">
                                {securityLoading ? (
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
                          <CardHeader className="p-4 lg:p-6">
                            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                              <Mail className="h-5 w-5" />
                              Изменить email
                            </CardTitle>
                            <CardDescription className="text-xs lg:text-sm mt-2">
                              Текущий email: <span className="font-medium">{user?.email}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
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

                              <Button type="submit" disabled={securityLoading} className="w-full sm:w-auto">
                                {securityLoading ? (
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
                          <CardContent className="p-4 lg:p-5">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-amber-800">
                                <p className="font-medium mb-2">Важная информация</p>
                                <ul className="list-disc list-inside space-y-1 text-xs lg:text-sm">
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
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            {previewItem && (
              <>
                <DialogHeader>
                  <DialogTitle>{previewItem.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{previewItem.category}</Badge>
                    {previewType === 'order' && previewItem.engagement && <Badge variant="outline">{previewItem.engagement}</Badge>}
                    {previewType === 'task' && previewItem.delivery_days && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {previewItem.delivery_days} дней
                      </Badge>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Описание</div>
                    <p className="text-sm text-[#3F7F6E] leading-relaxed whitespace-pre-wrap">{previewItem.description}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Теги</div>
                    <div className="flex flex-wrap gap-2">
                      {(previewItem.tags || []).map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  {previewType === 'task' && previewItem.features && (
                    <div>
                      <div className="text-sm font-medium mb-2">Что входит</div>
                      <ul className="list-disc list-inside text-sm text-[#3F7F6E]">
                        {previewItem.features.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-3">
                      {profile?.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center font-medium">
                          {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{profile?.name || 'Пользователь'}</div>
                        <div className="text-xs text-[#3F7F6E]">Опубликовано: {new Date(previewItem.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-xl font-semibold text-[#6FE7C8]">
                      {previewType === 'order' ? `${previewItem.currency} ${previewItem.price_min}–${previewItem.price_max}` : `${previewItem.currency} ${previewItem.price}`}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setPreviewOpen(false)}>Закрыть</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Portfolio Preview Dialog */}
        <Dialog open={portfolioPreviewOpen} onOpenChange={setPortfolioPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedPortfolioProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedPortfolioProject.title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6">
                  {selectedPortfolioProject.image_url && (
                    <div className="relative w-full overflow-hidden rounded-lg">
                      <img
                        src={selectedPortfolioProject.image_url}
                        alt={selectedPortfolioProject.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Описание проекта</h3>
                      <p className="text-[#3F7F6E] whitespace-pre-wrap">{selectedPortfolioProject.description}</p>
                    </div>

                    {selectedPortfolioProject.tags && selectedPortfolioProject.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Технологии</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedPortfolioProject.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPortfolioProject.project_url && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Ссылка на проект</h3>
                        <a
                          href={selectedPortfolioProject.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#6FE7C8] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {selectedPortfolioProject.project_url}
                        </a>
                      </div>
                    )}

                    {selectedPortfolioProject.created_at && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Дата добавления</h3>
                        <div className="flex items-center gap-2 text-[#3F7F6E]">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedPortfolioProject.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setPortfolioPreviewOpen(false)}>Закрыть</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

      {showMediaEditor && fileToEdit && (
        <MediaEditor file={fileToEdit} onSave={handleMediaSave} onCancel={handleMediaCancel} />
      )}
    </div>
  );
}
