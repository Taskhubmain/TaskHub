import { useState, useEffect } from 'react';
import { getSupabase, resetSupabase } from '@/lib/supabaseClient';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

export function DbStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking' | 'reconnecting'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoReconnectEnabled, setAutoReconnectEnabled] = useState(true);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const supabase = getSupabase();
      const { error } = await Promise.race([
        supabase.from('profiles').select('id').limit(1),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);

      if (error) {
        setStatus('disconnected');
        if (autoReconnectEnabled) {
          handleReconnect();
        }
      } else {
        const wasDisconnected = status === 'disconnected' || status === 'reconnecting';
        setStatus('connected');
        if (wasDisconnected) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
      setLastCheck(new Date());
    } catch {
      setStatus('disconnected');
      setLastCheck(new Date());
      if (autoReconnectEnabled) {
        handleReconnect();
      }
    }
  };

  const handleReconnect = async () => {
    if (status === 'reconnecting') return;

    setStatus('reconnecting');
    try {
      await resetSupabase();
      await checkConnection();
    } catch (err) {
      console.error('Reconnect failed:', err);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [autoReconnectEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (status === 'connected' && !showSuccess) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
      showSuccess
        ? 'bg-green-50 text-green-800 border border-green-200'
        : status === 'checking'
        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        : status === 'reconnecting'
        ? 'bg-blue-50 text-blue-800 border border-blue-200'
        : 'bg-red-50 text-red-800 border border-red-200'
    }`}>
      {showSuccess ? (
        <>
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Подключено</span>
        </>
      ) : status === 'checking' ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Проверка связи...</span>
        </>
      ) : status === 'reconnecting' ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Переподключение...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Нет связи с БД</span>
          <button
            onClick={handleReconnect}
            className="ml-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Переподключить
          </button>
          <button
            onClick={() => setAutoReconnectEnabled(!autoReconnectEnabled)}
            className={`ml-1 px-2 py-1 text-xs rounded transition-colors ${
              autoReconnectEnabled
                ? 'bg-red-200 text-red-900 hover:bg-red-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={autoReconnectEnabled ? 'Отключить авто-переподключение' : 'Включить авто-переподключение'}
          >
            {autoReconnectEnabled ? 'Авто' : 'Ручное'}
          </button>
        </>
      )}
    </div>
  );
}
