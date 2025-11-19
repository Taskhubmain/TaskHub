import { getSupabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    id: string;
    slug: string;
    name: string;
    bio?: string;
    skills: string[];
    avatarUrl?: string;
    location?: string;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
  };
  private listeners: Set<(state: AuthState) => void> = new Set();

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  private async initializeAuth() {
    const supabase = getSupabase();

    // Try to get existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      console.log('Found existing session for user:', session.user.email);
      await this.loadUserProfile(session.user.id, session.user.email || '');
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email);
          await this.loadUserProfile(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          this.authState = {
            user: null,
            accessToken: null,
            refreshToken: null,
          };
          this.notify();
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed automatically');
          if (session?.user) {
            this.authState.accessToken = session.access_token;
            this.authState.refreshToken = session.refresh_token || null;
            this.notify();
          }
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('Initial session detected:', session.user.email);
          await this.loadUserProfile(session.user.id, session.user.email || '');
        }
      })();
    });
  }

  private async loadUserProfile(userId: string, email: string) {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('No session found in loadUserProfile');
        this.authState = {
          user: null,
          accessToken: null,
          refreshToken: null,
        };
        this.notify();
        return;
      }

      console.log('Loading profile for user:', userId, email);

      // Try to get profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      }

      // Get user metadata from session
      const userMetadata = session.user.user_metadata || {};
      const displayName = userMetadata.full_name || userMetadata.name || email.split('@')[0];
      const avatarUrl = userMetadata.avatar_url || userMetadata.picture;
      const role = userMetadata.role || profile?.role || 'FREELANCER';

      this.authState = {
        user: {
          id: userId,
          email: email,
          role: role,
          profile: {
            id: userId,
            slug: profile?.slug || email.split('@')[0],
            name: profile?.name || displayName,
            bio: profile?.bio,
            skills: profile?.skills || [],
            avatarUrl: profile?.avatar_url || avatarUrl,
            location: profile?.location,
          }
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token || null,
      };

      console.log('Profile loaded successfully:', this.authState.user);
      this.notify();

      // Check if profile needs completion (only redirect if not already on that page and user is not admin)
      if (profile && !profile.profile_completed &&
          window.location.hash !== '#/profile-completion' &&
          role !== 'admin' &&
          !window.location.hash.startsWith('#/admin')) {
        console.log('Profile incomplete, redirecting to profile completion...');
        // Small delay to ensure state is updated
        setTimeout(() => {
          window.location.hash = '/profile-completion';
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  getState(): AuthState {
    return this.authState;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: 'CLIENT' | 'FREELANCER';
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          }
        }
      });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Ошибка регистрации' };
      }

      await this.loadUserProfile(authData.user.id, authData.user.email || '');

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { success: false, error: signInError.message };
      }

      if (!data.user) {
        return { success: false, error: 'Ошибка входа' };
      }

      await this.loadUserProfile(data.user.id, data.user.email || '');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  }

  async logout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();

    this.authState = {
      user: null,
      accessToken: null,
      refreshToken: null,
    };

    this.notify();

    window.location.hash = '/';
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        return false;
      }

      this.authState.accessToken = data.session.access_token;
      this.authState.refreshToken = data.session.refresh_token || null;
      this.notify();

      return true;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
    };

    return fetch(url, { ...options, headers });
  }

  isAuthenticated(): boolean {
    return !!this.authState.user && !!this.authState.accessToken;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  updateUserEmail(newEmail: string) {
    if (this.authState.user) {
      this.authState.user.email = newEmail;
      this.notify();
    }
  }
}

export const authService = AuthService.getInstance();
