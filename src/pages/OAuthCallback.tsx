import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function OAuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('OAuth callback error:', error);
          window.location.hash = '#/login';
          return;
        }

        if (session) {
          window.location.hash = '#/';
        } else {
          window.location.hash = '#/login';
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        window.location.hash = '#/login';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
