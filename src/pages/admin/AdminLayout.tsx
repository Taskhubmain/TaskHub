import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Briefcase, DollarSign, Settings, AlertTriangle, Lightbulb, LogOut, Menu, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      window.location.hash = '#/admin/login';
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileData || profileData.role !== 'ADMIN') {
      alert('У вас нет доступа к админ-панели');
      window.location.hash = '#/admin/login';
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await logout();
    window.location.hash = '#/admin/login';
  };

  const navigation = [
    { name: 'Дашборд', path: '/admin', icon: LayoutDashboard },
    { name: 'Пользователи', path: '/admin/users', icon: Users },
    { name: 'Сделки', path: '/admin/deals', icon: Briefcase },
    { name: 'Финансы', path: '/admin/finance', icon: DollarSign },
    { name: 'Категории', path: '/admin/categories', icon: FolderOpen },
    { name: 'Модерация', path: '/admin/moderation', icon: AlertTriangle },
    { name: 'Предложения', path: '/admin/suggestions', icon: Lightbulb },
    { name: 'Настройки', path: '/admin/settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#6FE7C8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <div className="lg:flex">
        <div
          className={`fixed inset-y-0 left-0 z-50 w-56 xs-375:w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 xs-375:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                  <p className="text-sm text-[#3F7F6E]">TaskHub</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-2 xs-375:p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;
                return (
                  <a
                    key={item.path}
                    href={`#${item.path}`}
                    className={`flex items-center gap-2 xs-375:gap-3 px-3 xs-375:px-4 py-2 xs-375:py-3 rounded-lg transition-colors text-sm xs-375:text-base ${
                      isActive
                        ? 'bg-[#6FE7C8]/20 text-[#3F7F6E] font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </a>
                );
              })}
            </nav>

            <div className="p-3 xs-375:p-4 border-t border-gray-200">
              {profile && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Администратор
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="flex-1">
          <div className="lg:hidden bg-white border-b border-gray-200 p-3 xs-375:p-4 flex items-center justify-between sticky top-0 z-30">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-10"></div>
          </div>

          <main className="p-3 xs-375:p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
