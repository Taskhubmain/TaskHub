import { useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';

export default function OAuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('OAuth callback error:', error);
          window.location.hash = '#/login';
          return;
        }

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && !profile.profile_completed) {
            window.location.hash = '#/profile-completion';
          } else {
            window.location.hash = '#/';
          }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6FE7C8] mx-auto mb-4"></div>
        <p className="text-[#3F7F6E]">Авторизация...</p>
      </div>
    </div>
  );
}
