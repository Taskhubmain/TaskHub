import { useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';

export default function OAuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('OAuth callback - session:', session?.user?.id);

        if (error) {
          console.error('OAuth callback error:', error);
          window.location.hash = '#/login';
          return;
        }

        if (session?.user) {
          console.log('OAuth callback - checking profile for user:', session.user.id);

          // Wait a bit for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('profile_completed, username')
            .eq('id', session.user.id)
            .maybeSingle();

          console.log('OAuth callback - profile:', profile, 'error:', profileError);

          if (!profile) {
            console.log('OAuth callback - profile not found, redirecting to profile completion');
            window.location.hash = '#/profile-completion';
          } else if (!profile.profile_completed) {
            console.log('OAuth callback - profile incomplete, redirecting to profile completion');
            window.location.hash = '#/profile-completion';
          } else {
            console.log('OAuth callback - profile complete, redirecting to home');
            window.location.hash = '#/';
          }
        } else {
          console.log('OAuth callback - no session, redirecting to login');
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
