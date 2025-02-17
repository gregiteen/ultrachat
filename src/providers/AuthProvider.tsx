import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { usePersonalizationStore } from '../store/personalization';
import { useContextStore } from '../store/context';
import { useThreadStore } from '../store/chat';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { init: initAuth, setUser } = useAuthStore();
  const { init: initPersonalization } = usePersonalizationStore();
  const { fetchContexts } = useContextStore();
  const { fetchThreads } = useThreadStore();
  const initializingRef = useRef(false);

  useEffect(() => {
    console.log('AuthProvider - Initializing auth');
    let mounted = true;
    let initialized = false;

    // Initialize auth
    const initialize = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        await initAuth();
        initialized = true;
      } catch (error) {
        console.error('Error initializing auth:', error);
        window.location.replace('/auth');
      } finally {
        initializingRef.current = false;
      }
    };

    initialize();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted || !initialized) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        // Clear all stores
        window.sessionStorage.clear();
        window.localStorage.clear();
        if (window.location.pathname !== '/auth') {
          window.location.replace('/auth');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        try {
          await Promise.all([
            initPersonalization(),
            fetchContexts(),
            fetchThreads()
          ]);
        } catch (error) {
          console.error('Error initializing data:', error);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initAuth, setUser, initPersonalization, fetchContexts, fetchThreads]);

  return <>{children}</>;
}