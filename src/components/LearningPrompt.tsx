import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';
import { queryWithRetry } from '@/lib/supabase-utils';

export default function LearningPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkIfShouldShow = async () => {
      if (!user) {
        setShow(false);
        return;
      }

      const dismissedKey = `learning_prompt_dismissed_${user.id}`;
      const isDismissed = localStorage.getItem(dismissedKey) === 'true';

      if (isDismissed) {
        setShow(false);
        return;
      }

      const { data } = await queryWithRetry(() =>
        getSupabase()
          .from('profiles')
          .select('learning_completed, profile_completed, created_at')
          .eq('id', user.id)
          .maybeSingle()
      );

      if (!data) {
        setShow(false);
        return;
      }

      const isNewUser = data.created_at
        ? (Date.now() - new Date(data.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
        : false;

      // Show only if profile is completed, learning not completed, and user is new
      if (data.profile_completed && !data.learning_completed && isNewUser) {
        // Delay showing prompt by 1 second to allow page transition
        setTimeout(() => setShow(true), 1000);
      } else {
        setShow(false);
      }
    };

    checkIfShouldShow();

    // Re-check when hash changes
    const handleHashChange = () => {
      checkIfShouldShow();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user?.id]);

  const handleDismiss = () => {
    const dismissedKey = `learning_prompt_dismissed_${user?.id}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    setShow(false);
  };

  const handleStartLearning = () => {
    window.location.hash = '/learning';
    handleDismiss();
  };

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-sm sm:max-w-sm mx-auto sm:mx-0"
      >
        <Card className="shadow-2xl border-2 border-[#6FE7C8] bg-gradient-to-br from-white to-[#EFFFF8]">
          <div className="p-5">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-[#3F7F6E] hover:text-foreground transition"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#6FE7C8]/20">
                <GraduationCap className="h-6 w-6 text-[#3F7F6E]" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Добро пожаловать на биржу!</h3>
                <p className="text-sm text-[#3F7F6E]">
                  Пройдите бесплатное обучение, чтобы узнать, как успешно работать на платформе
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStartLearning}
                className="flex-1"
              >
                Начать обучение
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="flex-1"
              >
                Позже
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
