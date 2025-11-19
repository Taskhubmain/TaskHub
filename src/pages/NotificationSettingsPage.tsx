import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Eye, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface NotificationSetting {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'newOrder',
      icon: <Mail className="h-5 w-5" />,
      title: 'Новые заказы',
      description: 'Уведомления о новых заказах в вашей категории',
      enabled: true,
    },
    {
      id: 'newProposal',
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Новые отклики',
      description: 'Когда кто-то откликается на ваши заказы',
      enabled: true,
    },
    {
      id: 'newMessage',
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Новые сообщения',
      description: 'Уведомления о новых сообщениях в чате',
      enabled: true,
    },
    {
      id: 'portfolioView',
      icon: <Eye className="h-5 w-5" />,
      title: 'Просмотры портфолио',
      description: 'Когда кто-то просматривает ваше портфолио',
      enabled: false,
    },
    {
      id: 'proposalStatus',
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Статус откликов',
      description: 'Принятие или отклонение ваших откликов',
      enabled: true,
    },
    {
      id: 'complaint',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Жалобы',
      description: 'Уведомления о жалобах на ваши отклики',
      enabled: true,
    },
    {
      id: 'system',
      icon: <Settings className="h-5 w-5" />,
      title: 'Системные уведомления',
      description: 'Важные обновления и изменения платформы',
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const enabledCount = settings.filter(s => s.enabled).length;

  return (
    <motion.div
      key="notification-settings"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Настройки уведомлений</h1>
          <p className="text-muted-foreground">
            Управляйте типами уведомлений, которые вы хотите получать
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#EFFFF8]">
                <Bell className="h-6 w-6 text-[#3F7F6E]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Активные уведомления</h3>
                <p className="text-sm text-muted-foreground">
                  Включено {enabledCount} из {settings.length} категорий
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#3F7F6E]">{enabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {settings.map(setting => (
            <Card key={setting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${setting.enabled ? 'bg-[#EFFFF8] text-[#3F7F6E]' : 'bg-gray-100 text-gray-400'}`}>
                    {setting.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{setting.title}</h3>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled ? 'bg-[#6FE7C8]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">О уведомлениях</p>
                <p>
                  Уведомления помогают быстро реагировать на новые возможности и важные события.
                  Вы можете в любой момент изменить эти настройки.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            setSettings(settings.map(s => ({ ...s, enabled: false })));
          }}>
            Отключить все
          </Button>
          <Button onClick={() => {
            setSettings(settings.map(s => ({ ...s, enabled: true })));
          }}>
            Включить все
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
