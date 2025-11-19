import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  MoreVertical,
  Trash2,
  Ban,
  AlertTriangle,
  Paperclip,
  X,
  Video,
  FileText,
  Check,
  CheckCheck,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSupabase } from '@/lib/supabaseClient';
import { useSupabaseKeepAlive } from '@/hooks/useSupabaseKeepAlive';
import { queryWithRetry, subscribeWithMonitoring } from '@/lib/supabase-utils';
import { useAuth } from '@/contexts/AuthContext';
import { navigateToProfile } from '@/lib/navigation';
import { MediaEditor } from '@/components/MediaEditor';
import { useContentModeration } from '@/hooks/useContentModeration';
import { ModerationAlert } from '@/components/ui/ModerationAlert';
import { ImageViewer } from '@/components/ImageViewer';
import { ChatCRMPanel } from '@/components/ChatCRMPanel';
import { CRMConfirmation } from '@/components/CRMConfirmation';
import DealProgressPanel from '@/components/DealProgressPanel';
import { ReviewInChat } from '@/components/ReviewInChat';
import { useRegion } from '@/contexts/RegionContext';

const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
const pageTransition = { duration: 0.2 };
const ONLINE_WINDOW_MS = 60_000;

interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  last_message_text?: string;
  unread_count_p1?: number;
  unread_count_p2?: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: 'image' | 'video' | 'file';
  type?: 'system' | 'text';
  created_at: string;
  is_read: boolean;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  is_online?: boolean;
  last_seen_at?: string;
}

const isOnlineFresh = (p?: { last_seen_at?: string | null }) => {
  if (!p?.last_seen_at) return false;
  return Date.now() - new Date(p.last_seen_at).getTime() <= ONLINE_WINDOW_MS;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { language } = useRegion();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [deals, setDeals] = useState<any[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteAlsoChat, setDeleteAlsoChat] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState<Array<{ url: string; name?: string }>>([]);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const { isBlocked, blockMessage, checkContent, checkContentImmediate } = useContentModeration({
    contentType: 'message',
  });
  const [crmPanelOpen, setCrmPanelOpen] = useState(false);
  const [progressPanelOpen, setProgressPanelOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [translateChat, setTranslateChat] = useState(false);
  const [translateMyMessages, setTranslateMyMessages] = useState(false);
  const [aiAgentEnabled, setAiAgentEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.4);
  const [translating, setTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatedInput, setTranslatedInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const crmButtonRef = useRef<HTMLButtonElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const shouldScrollRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  // Для UX "Печатает"
  const otherTypingHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justMarkedReadRef = useRef<Set<string>>(new Set());
  const otherTypingShownAtRef = useRef<number>(0);
  const wasTypingRef = useRef<boolean>(false);
  const prevScrollTopRef = useRef<number>(0);

  // last seen авто-старение
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Auto-translate all messages when translateChat is enabled
  useEffect(() => {
    if (!translateChat || !user) {
      setTranslatedMessages({});
      return;
    }

    const translateAllMessages = async () => {
      const messagesToTranslate = messages.filter(
        (msg) => (msg.content || msg.text) && !translatedMessages[msg.id]
      );

      for (const msg of messagesToTranslate) {
        const textToTranslate = msg.content || msg.text;
        if (textToTranslate) {
          const translated = await translateText(textToTranslate, language);
          setTranslatedMessages((prev) => ({ ...prev, [msg.id]: translated }));
        }
      }
    };

    translateAllMessages();
  }, [translateChat, messages, language, user]);

  // Clear translated messages when chat changes
  useEffect(() => {
    setTranslatedMessages({});
    setTranslatedInput('');
  }, [selectedChatId]);

  // Check if review was left when deal or messages change
  useEffect(() => {
    const checkReview = async () => {
      if (!user || !selectedChatId) {
        setHasReviewed(false);
        return;
      }

      const deal = deals.find((d) => d.chat_id === selectedChatId);
      if (!deal) {
        setHasReviewed(false);
        return;
      }

      try {
        const { data } = await getSupabase()
          .from('reviews')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('reviewer_id', user.id)
          .maybeSingle();

        setHasReviewed(!!data);
      } catch (error) {
        console.error('Error checking review status:', error);
      }
    };

    if (messages.length > 0) {
      checkReview();
    }
  }, [selectedChatId, deals, messages.length, user?.id]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node) &&
          menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const smoothScrollTo = (top: number) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top, behavior: 'smooth' });
  };

  const reinitAll = async () => {
    await loadChats(false);
    if (selectedChatId) await loadMessages(selectedChatId);
  };

  useSupabaseKeepAlive({
    onRecover: reinitAll,
    intervalMs: 90_000,
    headTable: 'profiles'
  });

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initChats = async () => {
      try {
        setError(null);
        await loadChats();
      } catch (error) {
        if (isMounted) {
          setError('Не удалось загрузить чаты. Попробуйте ещё раз.');
          setLoading(false);
        }
      }
    };

    initChats();
    updateOnlineStatus(true);

    const interval = setInterval(() => {
      updateOnlineStatus(true);
    }, 30_000);

    const chatsRefreshInterval = setInterval(() => {
      if (!document.hidden && isMounted) {
        loadChats(false);
      }
    }, 60_000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateOnlineStatus(true);
        loadChats(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    let userChatsSubscription: any = null;
    let profilesSubscription: any = null;

    subscribeWithMonitoring('user-chats', {
      table: 'chats',
      event: '*',
      callback: (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedChat = payload.new as Chat;

          if (justMarkedReadRef.current.has(updatedChat.id)) return;

          setChats((prev) => {
            const existingChat = prev.find((c) => c.id === updatedChat.id);
            if (!existingChat) return prev;

            return prev.map((c) => {
              if (c.id !== updatedChat.id) return c;

              if (updatedChat.id === selectedChatId && user) {
                const isP1 = updatedChat.participant1_id === user.id;
                return {
                  ...updatedChat,
                  unread_count_p1: isP1 ? 0 : updatedChat.unread_count_p1,
                  unread_count_p2: !isP1 ? 0 : updatedChat.unread_count_p2,
                };
              }

              return updatedChat;
            });
          });
        } else {
          loadChats(false);
        }
      },
      onError: () => setTimeout(() => loadChats(false), 2000)
    }).then(sub => { userChatsSubscription = sub; });

    subscribeWithMonitoring('profiles-changes', {
      table: 'profiles',
      event: 'UPDATE',
      callback: (payload) => {
        const updatedProfile = payload.new as Profile;
        setProfiles((prev) => ({
          ...prev,
          [updatedProfile.id]: {
            ...prev[updatedProfile.id],
            is_online: updatedProfile.is_online,
            last_seen_at: updatedProfile.last_seen_at,
            avatar_url: updatedProfile.avatar_url ?? prev[updatedProfile.id]?.avatar_url ?? null,
            name: updatedProfile.name ?? prev[updatedProfile.id]?.name ?? '',
          },
        }));
      }
    }).then(sub => { profilesSubscription = sub; });

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const chatId = params.get('chat');
    if (chatId) setSelectedChatId(chatId);

    const handleBeforeUnload = () => updateOnlineStatus(false);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(chatsRefreshInterval);
      updateOnlineStatus(false);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      userChatsSubscription?.unsubscribe();
      profilesSubscription?.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedChatId || !user) return;

    isInitialLoadRef.current = true;
    shouldScrollRef.current = true;

    let isMounted = true;

    const initMessages = async () => {
      if (!isMounted) return;
      try {
        await loadMessages(selectedChatId);
      } catch (error) {
        if (isMounted) setMessages([]);
      }
    };

    initMessages();

    const handleVisibilityChange = () => {
      if (!document.hidden && selectedChatId) {
        loadMessages(selectedChatId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    let messagesSubscription: any = null;

    subscribeWithMonitoring(`messages:${selectedChatId}`, {
      table: 'messages',
      event: 'INSERT',
      filter: `chat_id=eq.${selectedChatId}`,
      callback: async (payload) => {
        const newMessage = payload.new as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id && !m.id.startsWith('temp-'))) return prev;

          const hasTempMessage = prev.some((m) => m.id.startsWith('temp-') && m.text === newMessage.text);
          if (hasTempMessage && newMessage.sender_id === user.id) {
            return prev.map(m => m.id.startsWith('temp-') && m.text === newMessage.text ? newMessage : m);
          }

          if (newMessage.sender_id === user.id) {
            return prev;
          }

          shouldScrollRef.current = true;
          return [...prev, newMessage];
        });

        if (newMessage.sender_id !== user.id) {
          await markMessagesAsRead(selectedChatId);
        }
      },
      onError: () => setTimeout(() => loadMessages(selectedChatId), 2000)
    }).then(sub => { messagesSubscription = sub; });

    let messagesUpdateSubscription: any = null;
    subscribeWithMonitoring(`messages-update:${selectedChatId}`, {
      table: 'messages',
      event: 'UPDATE',
      filter: `chat_id=eq.${selectedChatId}`,
      callback: (payload) => {
        const updatedMessage = payload.new as Message;
        if (updatedMessage.sender_id === user.id) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      },
      onError: () => {}
    }).then(sub => { messagesUpdateSubscription = sub; });

    const typingSubscription = getSupabase()
      .channel(`typing:${selectedChatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `chat_id=eq.${selectedChatId}` },
        (payload) => {
          if (!user) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingData = payload.new as { user_id: string; updated_at: string };
            if (typingData.user_id !== user.id) {
              otherTypingShownAtRef.current = Date.now();
              setIsOtherUserTyping(true);

              if (otherTypingHideTimeoutRef.current) clearTimeout(otherTypingHideTimeoutRef.current);
              otherTypingHideTimeoutRef.current = setTimeout(() => {
                setIsOtherUserTyping(false);
              }, 1000);
            }
          } else if (payload.eventType === 'DELETE') {
            const typingData = payload.old as { user_id: string };
            if (typingData.user_id !== user.id) {
              const elapsed = Date.now() - otherTypingShownAtRef.current;
              const remain = Math.max(0, 1000 - elapsed);
              if (otherTypingHideTimeoutRef.current) clearTimeout(otherTypingHideTimeoutRef.current);
              otherTypingHideTimeoutRef.current = setTimeout(() => {
                setIsOtherUserTyping(false);
              }, remain);
            }
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      messagesSubscription?.unsubscribe();
      messagesUpdateSubscription?.unsubscribe();
      typingSubscription.unsubscribe();
      setIsOtherUserTyping(false);
      if (otherTypingHideTimeoutRef.current) clearTimeout(otherTypingHideTimeoutRef.current);
    };
  }, [selectedChatId, user]);

  // Скролл при "печатает" и назад
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isOtherUserTyping && !wasTypingRef.current) {
      wasTypingRef.current = true;
      prevScrollTopRef.current = el.scrollTop;
      scrollToBottom('smooth');
    }

    if (!isOtherUserTyping && wasTypingRef.current) {
      wasTypingRef.current = false;
      smoothScrollTo(prevScrollTopRef.current);
    }
  }, [isOtherUserTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }

    if (isInitialLoadRef.current) {
      setTimeout(() => scrollToBottom('auto'), 0);
      isInitialLoadRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (shouldScrollRef.current && messages.length > prevMessagesLengthRef.current) {
      setTimeout(() => scrollToBottom('smooth'), 0);
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const loadChats = async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);

    try {
      const { data: chatsData, error: chatsError } = await queryWithRetry(
        () => getSupabase()
          .from('chats')
          .select('*')
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
          .order('updated_at', { ascending: false })
      );

      if (chatsError) throw chatsError;

      setChats(chatsData || []);

      const userIds = new Set<string>();
      (chatsData || []).forEach((chat: Chat) => {
        userIds.add(chat.participant1_id);
        userIds.add(chat.participant2_id);
      });

      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await queryWithRetry(
          () => getSupabase()
            .from('profiles')
            .select('id, name, avatar_url, is_online, last_seen_at')
            .in('id', Array.from(userIds))
        );

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, Profile> = {};
        (profilesData || []).forEach((p: Profile) => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }

      const { data: dealsData } = await queryWithRetry(
        () => getSupabase()
          .from('deals')
          .select('*, orders(title), tasks(title)')
          .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
          .in('status', ['in_progress', 'submitted', 'completed'])
      );

      setDeals(dealsData || []);
    } catch (error) {
      console.error('❌ Error loading chats:', error);
      throw error;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const checkIfUserBlocked = async (chatId: string) => {
    if (!user) return;
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const otherUserId = getOtherParticipant(chat);
    const { data } = await getSupabase()
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherUserId)
      .maybeSingle();

    setIsUserBlocked(!!data);
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await queryWithRetry(
        () => getSupabase()
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
      );

      if (error) throw error;

      setMessages(data || []);
      await checkIfUserBlocked(chatId);
      await markMessagesAsRead(chatId);
      await checkIfReviewed();
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      throw error;
    }
  };

  const checkIfReviewed = async () => {
    if (!user || !currentDeal) {
      setHasReviewed(false);
      return;
    }

    try {
      const { data, error } = await getSupabase()
        .from('reviews')
        .select('id')
        .eq('deal_id', currentDeal.id)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      setHasReviewed(!!data);
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      await getSupabase()
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat_id === chatId && msg.sender_id !== user.id ? { ...msg, is_read: true } : msg
        )
      );

      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        const isP1 = chat.participant1_id === user.id;

        justMarkedReadRef.current.add(chatId);
        setTimeout(() => {
          justMarkedReadRef.current.delete(chatId);
        }, 3000);

        await getSupabase()
          .from('chats')
          .update({
            unread_count_p1: isP1 ? 0 : chat.unread_count_p1,
            unread_count_p2: !isP1 ? 0 : chat.unread_count_p2,
          })
          .eq('id', chatId);

        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  unread_count_p1: isP1 ? 0 : c.unread_count_p1,
                  unread_count_p2: !isP1 ? 0 : c.unread_count_p2,
                }
              : c
          )
        );
      }
    } catch {
      // no-op
    }
  };

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const handleTranslateInput = async () => {
    if (!message.trim() || translating) return;

    setTranslating(true);
    try {
      const translated = await translateText(message, language);
      setTranslatedInput(translated);
      setMessage(translated);
    } catch (error) {
      console.error('Error translating input:', error);
    } finally {
      setTranslating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || !selectedChatId || !user || translating) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat) return;

    const otherUserId = getOtherParticipant(selectedChat);
    const { data: isBlockedByOther } = await getSupabase()
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', user.id)
      .maybeSingle();

    if (isBlockedByOther) {
      alert('Невозможно отправить сообщение. Пользователь заблокировал вас.');
      return;
    }

    const messageText = message;
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      id: tempId,
      chat_id: selectedChatId,
      sender_id: user.id,
      text: messageText || '',
      created_at: new Date().toISOString(),
      is_read: false,
      file_url: undefined,
      file_name: undefined,
    };

    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage('');
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    scrollToBottom('smooth');

    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: 'image' | 'video' | 'file' | null = null;

      if (fileToUpload) {
        setUploading(true);
        const fileExt = fileToUpload.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await getSupabase()
          .storage
          .from('message-attachments')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: pub } = getSupabase().storage.from('message-attachments').getPublicUrl(filePath);
        fileUrl = pub.publicUrl;
        fileName = fileToUpload.name;

        if (fileToUpload.type.startsWith('image/')) fileType = 'image';
        else if (fileToUpload.type.startsWith('video/')) fileType = 'video';
        else fileType = 'file';

        setUploading(false);
      }

      const { data: insertedMessage, error } = await getSupabase().from('messages').insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        text: messageText || '',
        content: messageText || '',
        type: 'text',
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
      }).select().single();

      if (error) throw error;

      setMessages((prev) => prev.map(m => m.id === tempId ? insertedMessage : m));
      shouldScrollRef.current = false;

      if (messageText.trim()) {
        analyzeMessage(selectedChatId, messageText, user.id).catch(err =>
          console.error('AI analysis error:', err)
        );

        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              content: messageText,
              contentType: 'message',
              contentId: insertedMessage.id,
            }),
          }
        ).then(async (moderationResponse) => {
          const moderationResult = await moderationResponse.json();

          if (moderationResult.flagged && moderationResult.action === 'blocked') {
            await getSupabase()
              .from('messages')
              .delete()
              .eq('id', insertedMessage.id);

            setMessages((prev) => prev.filter((m) => m.id !== insertedMessage.id));

            alert(moderationResult.message || 'Ваше сообщение было удалено, так как содержит запрещенный контент');
          }
        }).catch(err => {
          console.error('Post-moderation error:', err);
        });
      }
    } catch (err) {
      console.error('Send message error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(messageText);
      alert('Ошибка при отправке сообщения');
    }
  };

  const analyzeMessage = async (chatId: string, text: string, senderId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat-analyzer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: crypto.randomUUID(),
          message_text: text,
          sender_id: senderId,
        }),
      });

      const result = await response.json();
      if (result.confirmations_pending > 0) {
        console.log('✅ CRM: Created', result.confirmations_pending, 'confirmations');
      }
    } catch (error) {
      console.error('❌ CRM Analysis error:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChatId) return;
    try {
      const { error } = await getSupabase().from('chats').delete().eq('id', selectedChatId);
      if (error) throw error;

      setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
      setMessages([]);
      setDeleteDialogOpen(false);
      setSelectedChatId(null);
      setShowChatOnMobile(false);
      alert('Чат удален');
    } catch {
      alert('Ошибка при удалении чата');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedChatId || !user) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat) return;

    const otherUserId = getOtherParticipant(selectedChat);

    try {
      const { error } = await getSupabase().from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: otherUserId,
      });

      // @ts-ignore
      if (error?.code === '23505') {
        alert('Этот пользователь уже заблокирован');
        return;
      } else if (error) {
        throw error;
      }

      if (deleteAlsoChat) {
        await getSupabase().from('chats').delete().eq('id', selectedChatId);
        setSelectedChatId(null);
      }

      alert('Пользователь заблокирован.');
      setBlockDialogOpen(false);
      setDeleteAlsoChat(false);
      await loadChats();
    } catch {
      alert('Ошибка при блокировке пользователя');
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedChatId || !user) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat) return;

    const otherUserId = getOtherParticipant(selectedChat);

    try {
      const { error } = await getSupabase()
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', otherUserId);

      if (error) throw error;

      setIsUserBlocked(false);
    } catch {
      alert('Ошибка при разблокировке пользователя');
    }
  };

  const handleReportUser = async () => {
    if (!user || !selectedChatId) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat) return;

    const otherUserId = selectedChat.participant1_id === user.id
      ? selectedChat.participant2_id
      : selectedChat.participant1_id;

    if (!otherUserId) return;

    const { error } = await getSupabase()
      .from('chat_reports')
      .insert({
        chat_id: selectedChatId,
        reporter_id: user.id,
        reported_user_id: otherUserId,
        reason: reportReason || null,
      });

    if (error) {
      alert('Ошибка при отправке жалобы');
      return;
    }

    alert('Жалоба отправлена. Мы рассмотрим её в ближайшее время.');
    setReportDialogOpen(false);
    setReportReason('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setFileToEdit(file);
      setShowMediaEditor(true);
    } else {
      setSelectedFile(file);
    }
  };

  const handleMediaSave = (editedFile: File) => {
    setSelectedFile(editedFile);
    setShowMediaEditor(false);
    setFileToEdit(null);
  };

  const handleMediaCancel = () => {
    setShowMediaEditor(false);
    setFileToEdit(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageClick = (imageUrl: string, imageName?: string) => {
    const chatImages = messages
      .filter((m) => m.file_type === 'image' && m.file_url)
      .map((m) => ({ url: m.file_url!, name: m.file_name }));

    const clickedIndex = chatImages.findIndex((img) => img.url === imageUrl);

    setImageViewerImages(chatImages);
    setImageViewerIndex(clickedIndex >= 0 ? clickedIndex : 0);
    setShowImageViewer(true);
  };

  const getOtherParticipant = (chat: Chat): string => {
    if (!user) return '';
    return chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await getSupabase()
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const sendTypingIndicator = async () => {
    if (!selectedChatId || !user) return;

    try {
      await getSupabase()
        .from('typing_indicators')
        .upsert(
          { chat_id: selectedChatId, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'chat_id,user_id' }
        );

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        await getSupabase()
          .from('typing_indicators')
          .delete()
          .eq('chat_id', selectedChatId)
          .eq('user_id', user.id);
      }, 3000);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  const getLastSeenText = (profile: Profile | undefined): string => {
    if (!profile) return 'был(а) в сети недавно';

    const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : null;
    const fresh = lastSeen ? nowTick - lastSeen <= ONLINE_WINDOW_MS : false;

    if (fresh) return 'В сети';
    if (!lastSeen) return 'был(а) в сети недавно';

    const diffMs = nowTick - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `был(а) в сети ${diffMins} мин. назад`;
    if (diffHours < 24) return `был(а) в сети ${diffHours} ч. назад`;
    if (diffDays === 1) return 'был(а) в сети вчера';
    if (diffDays < 7) return `был(а) в сети ${diffDays} дн. назад`;
    return `был(а) в сети ${new Date(lastSeen).toLocaleDateString('ru-RU')}`;
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const otherUserId = getOtherParticipant(chat);
    const profile = profiles[otherUserId];
    return profile?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const getUserDeals = (userId: string) => {
    if (!user) return [];
    return deals.filter(deal => {
      const otherParty = deal.client_id === user.id ? deal.freelancer_id : deal.client_id;
      return otherParty === userId;
    });
  };

  const groupedChats = useMemo(() => {
    const groups: Record<string, { mainChat: Chat | null; dealChats: Array<{ deal: any; chat: Chat | null }> }> = {};

    // Сначала создаем группы для сделок
    deals.forEach(deal => {
      if (!user) return;
      const otherUserId = deal.client_id === user.id ? deal.freelancer_id : deal.client_id;

      if (!groups[otherUserId]) {
        groups[otherUserId] = { mainChat: null, dealChats: [] };
      }

      const dealChat = chats.find(c => c.id === deal.chat_id);
      groups[otherUserId].dealChats.push({ deal, chat: dealChat || null });
    });

    // Получаем ID всех чатов сделок
    const dealChatIds = new Set(deals.map(d => d.chat_id).filter(Boolean));

    // Затем добавляем общие чаты (которые не являются чатами сделок)
    filteredChats.forEach(chat => {
      const otherUserId = getOtherParticipant(chat);

      if (!dealChatIds.has(chat.id)) {
        // Это общий чат
        if (!groups[otherUserId]) {
          groups[otherUserId] = { mainChat: chat, dealChats: [] };
        } else if (!groups[otherUserId].mainChat) {
          groups[otherUserId].mainChat = chat;
        }
      }
    });

    return groups;
  }, [filteredChats, deals, chats, user]);

  const currentChat = chats.find((c) => c.id === selectedChatId);
  const currentOtherUserId = currentChat ? getOtherParticipant(currentChat) : null;
  const currentProfile = currentOtherUserId ? profiles[currentOtherUserId] : null;

  const currentDeal = useMemo(() => {
    if (!selectedChatId || !user) return null;
    return deals.find((deal) => deal.chat_id === selectedChatId);
  }, [selectedChatId, deals, user]);

  const isFreelancer = useMemo(() => {
    if (!currentDeal || !user) return false;
    return currentDeal.freelancer_id === user.id;
  }, [currentDeal, user]);

  const totalUnreadOtherChats = useMemo(() => {
    if (!user) return 0;
    return chats.reduce((sum, c) => {
      if (c.id === selectedChatId) return sum;
      if (c.participant1_id === user.id) return sum + (c.unread_count_p1 || 0);
      if (c.participant2_id === user.id) return sum + (c.unread_count_p2 || 0);
      return sum;
    }, 0);
  }, [chats, user, selectedChatId]);

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // ======== АВТО-РОСТ TEXTAREA до 8 строк ========
  const MAX_ROWS = 8;

  const autosize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const cs = window.getComputedStyle(ta);
    const line = parseFloat(cs.lineHeight || '20');
    const padTop = parseFloat(cs.paddingTop || '0');
    const padBot = parseFloat(cs.paddingBottom || '0');
    const maxH = line * MAX_ROWS + padTop + padBot;
    const newH = Math.min(ta.scrollHeight, maxH);
    ta.style.height = `${newH}px`;
    ta.style.overflowY = ta.scrollHeight > maxH ? 'auto' : 'hidden';
  };

  useEffect(() => { autosize(); }, [message]);

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = (e.currentTarget as HTMLTextAreaElement).closest('form');
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };
  // ================================================

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="bg-background">
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Сообщения</h1>

        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6FE7C8] border-r-transparent mb-4"></div>
              <p className="text-[#3F7F6E]">Загрузка сообщений...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-[600px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button onClick={() => { setError(null); setLoading(true); loadChats(); }}>
                  Попробовать снова
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Обновить страницу
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${currentDeal ? 'lg:grid-cols-[320px_1fr_380px]' : 'lg:grid-cols-[320px_1fr]'} gap-6 h[calc(100vh-200px)] h-[calc(100vh-200px)] max-h-[800px] min-h-0`}>
            {/* Список чатов */}
            <Card className={`overflow-hidden h-full min-h-0 flex flex-col ${showChatOnMobile && selectedChatId ? 'hidden lg:flex' : ''}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск пользователей..."
                    className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0">
                {Object.keys(groupedChats).length === 0 ? (
                  <div className="p-4 text-center text-[#3F7F6E]">
                    {searchQuery ? 'Ничего не найдено' : 'Нет активных чатов'}
                  </div>
                ) : (
                  Object.entries(groupedChats).map(([otherUserId, group]) => {
                    const profile = profiles[otherUserId];
                    const online = isOnlineFresh(profile);
                    const chat = group.mainChat;
                    const hasDeals = group.dealChats.length > 0;
                    const isExpanded = expandedUsers.has(otherUserId);
                    const hasMainChat = chat !== null;

                    // Если нет основного чата, берем информацию из первого чата сделки
                    const displayChat = chat || (group.dealChats[0]?.chat);

                    const unreadCount = chat
                      ? (chat.participant1_id === user?.id ? (chat.unread_count_p1 || 0) : (chat.unread_count_p2 || 0))
                      : 0;

                    return (
                      <div key={otherUserId} className="border-b">
                        <div
                          onClick={() => {
                            if (hasDeals) {
                              // Если есть сделки - только раскрываем/сворачиваем гармошку
                              toggleUserExpanded(otherUserId);
                            } else if (hasMainChat) {
                              // Если сделок нет и есть общий чат - открываем его
                              setSelectedChatId(chat.id);
                              setShowChatOnMobile(true);
                            }
                          }}
                          className={`p-4 cursor-pointer hover:bg-[#EFFFF8] ${
                            !hasDeals && chat && selectedChatId === chat.id ? 'bg-[#EFFFF8]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="cursor-pointer relative"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToProfile(otherUserId, user?.id);
                              }}
                            >
                              {profile?.avatar_url ? (
                                <div className="relative">
                                  <img
                                    src={profile.avatar_url}
                                    alt={profile?.name || 'Пользователь'}
                                    className="h-10 w-10 rounded-full object-cover transition-opacity hover:opacity-80"
                                  />
                                  {online && (
                                    <span
                                      className="absolute block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white pointer-events-none z-10"
                                      style={{ bottom: '2px', right: '2px' }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="relative h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                                  <span className="text-sm font-medium">{profile?.name?.charAt(0) ?? 'U'}</span>
                                  {online && (
                                    <span
                                      className="absolute block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white pointer-events-none z-10"
                                      style={{ bottom: '2px', right: '2px' }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold truncate">{profile?.name || 'Пользователь'}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#3F7F6E]">
                                    {displayChat?.last_message_at
                                      ? new Date(displayChat.last_message_at).toLocaleTimeString('ru-RU', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : ''}
                                  </span>
                                  {unreadCount > 0 && (
                                    <div className="h-5 min-w-5 px-1.5 rounded-full bg-[#6FE7C8] text-white text-xs font-semibold flex items-center justify-center">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </div>
                                  )}
                                  {hasDeals && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUserExpanded(otherUserId);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {!hasDeals && chat && (
                                <div className="text-sm text-[#3F7F6E] truncate">
                                  {chat.last_message_text || 'Нет сообщений'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {hasDeals && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="bg-[#EFFFF8]/30 overflow-hidden"
                            >
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();

                                if (chat) {
                                  setSelectedChatId(chat.id);
                                } else {
                                  // Создаем общий чат, если его еще нет
                                  try {
                                    const { data: newChat, error } = await getSupabase()
                                      .from('chats')
                                      .insert({
                                        participant1_id: user!.id,
                                        participant2_id: otherUserId
                                      })
                                      .select()
                                      .single();

                                    if (error) throw error;

                                    // Обновляем состояние чатов и выбираем новый чат
                                    setChats(prev => [...prev, newChat]);
                                    setSelectedChatId(newChat.id);

                                    // Перезагружаем список чатов для обновления счетчиков
                                    await loadChats(false);
                                  } catch (error) {
                                    console.error('Error creating general chat:', error);
                                  }
                                }
                              }}
                              className={`p-3 pl-16 cursor-pointer hover:bg-[#EFFFF8] ${
                                chat && selectedChatId === chat.id ? 'bg-[#EFFFF8]' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Общий чат</span>
                                {unreadCount > 0 && (
                                  <div className="h-5 min-w-5 px-1.5 rounded-full bg-[#6FE7C8] text-white text-xs font-semibold flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </div>
                                )}
                              </div>
                            </div>

                            {group.dealChats.map(({ deal, chat: dealChat }) => {
                              const dealTitle = deal.orders?.[0]?.title || deal.tasks?.[0]?.title || deal.title;
                              const dealUnread = dealChat
                                ? (dealChat.participant1_id === user?.id
                                    ? dealChat.unread_count_p1 || 0
                                    : dealChat.unread_count_p2 || 0)
                                : 0;

                              return (
                                <div
                                  key={deal.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (dealChat) {
                                      setSelectedChatId(dealChat.id);
                                      setShowChatOnMobile(true);
                                    }
                                  }}
                                  className={`p-3 pl-16 cursor-pointer hover:bg-[#EFFFF8] ${
                                    selectedChatId === dealChat?.id ? 'bg-[#EFFFF8]' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Briefcase className="h-3 w-3 text-[#3F7F6E] flex-shrink-0" />
                                      <span className="text-sm truncate">{dealTitle}</span>
                                    </div>
                                    {dealUnread > 0 && (
                                      <div className="h-5 min-w-5 px-1.5 rounded-full bg-[#6FE7C8] text-white text-xs font-semibold flex items-center justify-center">
                                        {dealUnread > 99 ? '99+' : dealUnread}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Окно чата */}
            {selectedChatId && currentProfile ? (
              <Card className={`flex flex-col h-full min-h-0 overflow-hidden relative ${!showChatOnMobile ? 'hidden lg:flex' : ''}`}>
                <div className="p-3 xs-375:p-4 border-b flex items-center justify-between gap-2">
                  <button
                    onClick={() => setShowChatOnMobile(false)}
                    className="lg:hidden flex-shrink-0 p-2 hover:bg-[#EFFFF8] rounded-lg transition"
                    aria-label="Назад к чатам"
                  >
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  <div
                    className="flex items-center gap-2 xs-375:gap-3 hover:opacity-80 transition cursor-pointer flex-1 min-w-0"
                    onClick={() => navigateToProfile(currentOtherUserId || '', user?.id)}
                  >
                    <div className="relative">
                      {currentProfile.avatar_url ? (
                        <img src={currentProfile.avatar_url} alt={currentProfile.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#EFFFF8] flex items-center justify-center">
                          <span className="text-sm font-medium">{currentProfile.name?.charAt(0)}</span>
                        </div>
                      )}
                      {totalUnreadOtherChats > 0 && (
                        <span
                          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[#6FE7C8] text-white text-xs font-semibold flex items-center justify-center pointer-events-none z-10"
                          title="Непрочитанные в других чатах"
                        >
                          {totalUnreadOtherChats > 99 ? '99+' : totalUnreadOtherChats}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm xs-375:text-base truncate">{currentProfile.name}</div>
                      <div className="text-xs text-[#3F7F6E] flex items-center gap-1 truncate">
                        {isOtherUserTyping ? (
                          <>
                            <span>Печатает</span>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-[#3F7F6E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-[#3F7F6E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-[#3F7F6E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </>
                        ) : (
                          <>{getLastSeenText(currentProfile)}</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Button
                      ref={menuButtonRef}
                      variant="ghost"
                      size="sm"
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[180px]"
                      >
                        <button
                          onClick={() => { setDeleteDialogOpen(true); setMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить чат
                        </button>
                        <button
                          onClick={() => { setBlockDialogOpen(true); setMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                        >
                          <Ban className="h-4 w-4" />
                          Заблокировать
                        </button>
                        <button
                          onClick={() => { setReportDialogOpen(true); setMenuOpen(false); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Пожаловаться
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute left-4 top-20 flex flex-col gap-2 z-20">
                  {/* CRM Button */}
                  <button
                    ref={crmButtonRef}
                    onClick={() => setCrmPanelOpen(true)}
                    className="w-12 h-12 rounded-full bg-[#3F7F6E] hover:bg-[#2d5f52] text-white flex items-center justify-center text-xs font-semibold transition shadow-lg"
                    title="CRM Чата"
                  >
                    CRM
                  </button>

                  {/* Floating Translation Button */}
                  <button
                    onClick={() => setShowTranslationSettings(true)}
                    className="w-12 h-12 rounded-full bg-[#6FE7C8] hover:bg-[#5cd4b5] text-white flex items-center justify-center transition shadow-lg"
                    title="Перевод"
                  >
                    <Languages className="h-5 w-5" />
                  </button>

                  {/* Progress Button - только для мобильных */}
                  <button
                    onClick={() => setProgressPanelOpen(true)}
                    className={`lg:hidden w-12 h-12 rounded-full text-white flex items-center justify-center transition shadow-lg ${
                      currentDeal
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed opacity-60'
                    }`}
                    title={currentDeal ? "Текущий прогресс" : "Прогресс доступен только для сделок"}
                    disabled={!currentDeal}
                  >
                    <Briefcase className="h-5 w-5" />
                  </button>
                </div>

                {/* CRM Confirmation Notifications */}
                {selectedChatId && (
                  <CRMConfirmation
                    chatId={selectedChatId}
                    aiAgentEnabled={aiAgentEnabled}
                    confidenceThreshold={confidenceThreshold}
                  />
                )}

                <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">

                  {messages.length === 0 ? (
                    <div className="text-center text-[#3F7F6E] mt-8">Начните разговор</div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user?.id;
                      const isSystem = (msg as any).is_system || msg.type === 'system';
                      const systemType = (msg as any).system_type;

                      if (isSystem) {
                        const isWorkAccepted = systemType === 'work_accepted';
                        const isLastMessage = index === messages.length - 1;

                        return (
                          <div key={msg.id}>
                            <div className="flex justify-center my-4">
                              <div className="max-w-[80%] rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                                <div className="text-sm text-amber-900 text-center whitespace-pre-wrap break-words">
                                  {msg.content || msg.text}
                                </div>
                                <div className="text-xs text-amber-700 text-center mt-2">
                                  {formatTime(msg.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Show review form after work accepted message for client */}
                            {isWorkAccepted && isLastMessage && !isFreelancer && currentDeal && !hasReviewed && (
                              <ReviewInChat
                                dealId={currentDeal.id}
                                revieweeId={currentDeal.freelancer_id}
                                reviewerId={user!.id}
                                onSubmitted={() => {
                                  setHasReviewed(true);
                                  alert('Спасибо за отзыв!');
                                }}
                              />
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg overflow-hidden ${isOwn ? 'bg-[#6FE7C8] text-white' : 'bg-gray-100'}`}>
                            {msg.file_type === 'image' && msg.file_url && (
                              <div onClick={() => handleImageClick(msg.file_url!, msg.file_name)}>
                                <img src={msg.file_url} alt={msg.file_name || 'Image'} className="w-full max-w-sm cursor-pointer hover:opacity-90 transition" />
                              </div>
                            )}
                            {msg.file_type === 'video' && msg.file_url && (
                              <video src={msg.file_url} controls className="w-full max-w-sm" />
                            )}
                            {msg.file_type === 'file' && msg.file_url && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 hover:opacity-80 transition ${isOwn ? 'bg-white/10' : 'bg-[#3F7F6E]/5'}`}
                              >
                                <div className={`p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-[#3F7F6E]/10'}`}>
                                  <FileText className={`h-5 w-5 ${isOwn ? 'text-white' : 'text-[#3F7F6E]'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                    {msg.file_name || 'Файл'}
                                  </p>
                                  <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-[#3F7F6E]'}`}>
                                    Нажмите для скачивания
                                  </p>
                                </div>
                              </a>
                            )}
                            {(msg.content || msg.text) && (
                              <div className="p-3">
                                <div className="text-sm whitespace-pre-wrap break-words">
                                  {translateChat ? (translatedMessages[msg.id] || msg.content || msg.text) : (msg.content || msg.text)}
                                </div>
                              </div>
                            )}
                            <div className={`px-3 pb-2 text-xs flex items-center justify-between gap-2 ${isOwn ? 'text-white/70' : 'text-[#3F7F6E]'}`}>
                              <span>{formatTime(msg.created_at)}</span>
                              {isOwn && (
                                <span className="flex items-center">
                                  {msg.is_read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] rounded-lg bg-gray-100 px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t">
                  {selectedFile && (
                    <div className="mb-2 p-3 bg-[#EFFFF8] rounded-lg border border-[#3F7F6E]/20">
                      <div className="flex items-start gap-3">
                        {selectedFile.type.startsWith('image/') ? (
                          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : selectedFile.type.startsWith('video/') ? (
                          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            <Video className="h-8 w-8 text-[#3F7F6E]" />
                          </div>
                        ) : (
                          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-[#3F7F6E]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-[#3F7F6E] mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={removeSelectedFile} className="flex-shrink-0 hover:opacity-70 transition p-1">
                          <X className="h-5 w-5 text-[#3F7F6E]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {isUserBlocked ? (
                    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Ban className="h-5 w-5 text-[#3F7F6E]" />
                        <span>Вы не можете отправлять сообщения данному пользователю, так как заблокировали его ранее</span>
                      </div>
                      <Button className="bg-[#3F7F6E] hover:bg-[#2d5f52] text-white" onClick={handleUnblockUser}>
                        Разблокировать пользователя
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <ModerationAlert message={blockMessage} isVisible={isBlocked} />

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="hover:bg-[#EFFFF8]">
                          <Paperclip className="h-4 w-4 text-[#3F7F6E]" />
                        </Button>

                        <textarea
                          ref={textareaRef}
                          value={message}
                          onChange={(e) => {
                            setMessage(e.target.value);
                            setTranslatedInput('');
                            checkContent(e.target.value);
                            if (e.target.value.trim()) sendTypingIndicator();
                            autosize();
                          }}
                          onKeyDown={(e) => {
                            if (translating) {
                              e.preventDefault();
                              return;
                            }
                            handleComposerKeyDown(e);
                          }}
                          placeholder="Введите сообщение..."
                          disabled={uploading || translating}
                          rows={1}
                          className="min-h-11 w-full h-auto resize-none leading-5 px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />

                        {translateMyMessages && message.trim() && !translatedInput && (
                          <Button
                            type="button"
                            onClick={handleTranslateInput}
                            disabled={translating || uploading}
                            variant="outline"
                            className="hover:bg-[#EFFFF8]"
                          >
                            <Languages className="h-4 w-4" />
                          </Button>
                        )}

                        <Button type="submit" disabled={(!message.trim() && !selectedFile) || uploading || isBlocked || translating}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-full min-h-0">
                <div className="text-center text-[#3F7F6E] p-8">
                  {filteredChats.length === 0 ? (
                    <div>
                      <p className="mb-2">У вас пока нет чатов</p>
                      <p className="text-sm">Нажмите "Написать" на странице пользователя, чтобы начать разговор</p>
                    </div>
                  ) : (
                    <p>TaskHub - ваш выбор в проведении безопасных сделок!</p>
                  )}
                </div>
              </Card>
            )}

            {/* Deal Progress Panel - только на больших экранах */}
            <AnimatePresence mode="wait">
              {currentDeal && user && (
                <div className="hidden lg:block">
                  <DealProgressPanel
                    dealId={currentDeal.id}
                    userId={user.id}
                    isFreelancer={isFreelancer}
                    chatId={selectedChatId || undefined}
                    freelancerId={currentDeal.freelancer_id}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Диалоги */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить чат?</DialogTitle>
            <DialogDescription>Все сообщения в этом чате будут удалены безвозвратно.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDeleteChat}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockDialogOpen} onOpenChange={(open) => { setBlockDialogOpen(open); if (!open) setDeleteAlsoChat(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя?</DialogTitle>
            <DialogDescription>Пользователь не сможет отправлять вам сообщения.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAlsoChat}
                onChange={(e) => setDeleteAlsoChat(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3F7F6E] focus:ring-[#3F7F6E]"
              />
              <span className="text-sm text-gray-700">Также удалить чат с этим пользователем</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setBlockDialogOpen(false); setDeleteAlsoChat(false); }}>Отмена</Button>
            <Button onClick={handleBlockUser}>Заблокировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пожаловаться на пользователя</DialogTitle>
            <DialogDescription>Опишите причину жалобы. Мы рассмотрим её в ближайшее время.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Причина жалобы (необязательно)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setReportDialogOpen(false); setReportReason(''); }}>Отмена</Button>
            <Button variant="destructive" onClick={handleReportUser}>Отправить жалобу</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showMediaEditor && fileToEdit && (
        <MediaEditor file={fileToEdit} onSave={handleMediaSave} onCancel={handleMediaCancel} />
      )}

      {showImageViewer && imageViewerImages.length > 0 && (
        <ImageViewer images={imageViewerImages} initialIndex={imageViewerIndex} onClose={() => setShowImageViewer(false)} />
      )}

      {selectedChatId && user && (
        <ChatCRMPanel
          chatId={selectedChatId}
          isOpen={crmPanelOpen}
          onClose={() => setCrmPanelOpen(false)}
          currentUserId={user.id}
          triggerRef={crmButtonRef}
          aiAgentEnabled={aiAgentEnabled}
          setAiAgentEnabled={setAiAgentEnabled}
          confidenceThreshold={confidenceThreshold}
          setConfidenceThreshold={setConfidenceThreshold}
        />
      )}

      {/* Deal Progress Panel для мобильных */}
      <AnimatePresence>
        {progressPanelOpen && currentDeal && user && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full xs-414:w-96 bg-white shadow-2xl z-50 overflow-y-auto lg:hidden"
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-lg">Текущий прогресс</h2>
              <button
                onClick={() => setProgressPanelOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <DealProgressPanel
                dealId={currentDeal.id}
                userId={user.id}
                isFreelancer={isFreelancer}
                chatId={selectedChatId || undefined}
                freelancerId={currentDeal.freelancer_id}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation Settings Dialog */}
      {showTranslationSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTranslationSettings(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#3F7F6E] mb-4">Настройки перевода</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Переводить чат</label>
                <button
                  onClick={() => setTranslateChat(!translateChat)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    translateChat ? 'bg-[#6FE7C8]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      translateChat ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Переводить мои сообщения</label>
                <button
                  onClick={() => setTranslateMyMessages(!translateMyMessages)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    translateMyMessages ? 'bg-[#6FE7C8]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      translateMyMessages ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {(translateChat || translateMyMessages) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Сообщения переводятся на язык, выбранный в настройках региона в NavBar: <span className="font-semibold">{language.toUpperCase()}</span>
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowTranslationSettings(false)}
              className="w-full mt-6 bg-[#3F7F6E] hover:bg-[#2d5f52]"
            >
              Сохранить
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
