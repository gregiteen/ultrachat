import { create } from 'zustand';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase-client';

// Types
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Create store
const useAuthStore = create<AuthState>(() => ({
  user: null,
  loading: true,
  error: null
}));

// Auth service
class AuthService {
  private static instance: AuthService | null = null;
  private initialized = false;
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    // Initialize auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        useAuthStore.setState({
          user: session?.user ?? null,
          loading: false
        });
      }
    );

    this.unsubscribe = subscription.unsubscribe;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      useAuthStore.setState({
        user: session?.user ?? null,
        loading: false
      });
      this.initialized = true;
    });
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      useAuthStore.setState({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      useAuthStore.setState({
        error: error instanceof AuthError ? error.message : 'Failed to sign in'
      });
      throw error;
    } finally {
      useAuthStore.setState({ loading: false });
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    try {
      useAuthStore.setState({ loading: true, error: null });
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      useAuthStore.setState({
        error: error instanceof AuthError ? error.message : 'Failed to sign up'
      });
      throw error;
    } finally {
      useAuthStore.setState({ loading: false });
    }
  }

  async signOut(): Promise<void> {
    try {
      useAuthStore.setState({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      useAuthStore.setState({
        error: error instanceof AuthError ? error.message : 'Failed to sign out'
      });
      throw error;
    } finally {
      useAuthStore.setState({ loading: false });
    }
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.initialized = false;
    AuthService.instance = null;
    useAuthStore.setState({
      user: null,
      loading: true,
      error: null
    });
  }
}

// Create instance
const auth = AuthService.getInstance();

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    auth.cleanup();
  });
}

// Export singleton instance and store hook
export { auth };
export const useAuth = () => useAuthStore();