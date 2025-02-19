import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase, mapSupabaseUser, initSession } from '../lib/supabase';
import { initializeStores, cleanupStores } from '../lib/store-initializer';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { init: initAuth, setUser, initialized: authInitialized } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Initialize auth only (not stores) to check session
  const initializeApp = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    setError(null);

    try {
      console.log('AuthProvider - Starting initialization');
      
      // Initialize session from storage first
      await initSession();
      
      // Then get the current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthProvider - Got session:', session ? 'yes' : 'no');

      // Initialize auth first
      await initAuth();
      console.log('AuthProvider - Auth initialized');

      // Set user and initialize stores if session exists or was restored
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        console.log('AuthProvider - User set:', session.user.id);
        await initializeStores(session.user.id);
        console.log('AuthProvider - Stores initialized');
      } else {
        setUser(null);
        // Only redirect to home if we're not already there and not on auth page
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/auth') {
          console.log('AuthProvider - No session, redirecting to home');
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing app:', errorMessage, error);
      setError(`Failed to initialize application: ${errorMessage}`);
      // Don't navigate on error, let the user stay on their current page
    } finally {
      setIsInitializing(false);
      initializingRef.current = false;
    }
  };

  // Initial setup
  useEffect(() => {
    console.log('AuthProvider - Starting initialization');
    initializeApp();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        cleanupStores();
        if (window.location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        setIsInitializing(true);
        setError(null);
        
        try {
          // Set user and initialize stores after successful sign in
          setUser(mapSupabaseUser(session.user));
          console.log('AuthProvider - User set:', session.user.id);

          // Initialize stores only after sign in
          await initializeStores(session.user.id);
          console.log('AuthProvider - Stores initialized after sign in');
        } catch (error) {
          console.error('Error initializing data:', error);
          setError('Failed to initialize data. Please try refreshing the page.');
          // Don't navigate on error
        } finally {
          setIsInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initAuth, setUser, navigate]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-sm text-muted-foreground">
            Loading... Please wait
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg text-destructive">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}