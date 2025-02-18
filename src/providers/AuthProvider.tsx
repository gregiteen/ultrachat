import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { usePersonalizationStore } from '../store/personalization';
import { useContextStore } from '../store/context';
import { useThreadStore } from '../store/chat';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
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
        navigate('/', { replace: true });
      } finally {
        initializingRef.current = false;
      }
    };

    initialize();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      // Update auth token
      if (session?.access_token) {
        localStorage.setItem('supabase-auth-token', session.access_token);
      } else {
        localStorage.removeItem('supabase-auth-token');
      }

      if (!mounted || !initialized) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        // Clear all stores
        window.sessionStorage.clear();
        window.localStorage.clear();
        if (window.location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        try {
          // Initialize all required data
          await Promise.all([
            initPersonalization(),
            fetchContexts(),
            fetchThreads()
          ]);

          // Navigate to chat page after successful initialization
          if (window.location.pathname === '/') {
            navigate('/chat', { replace: true });
          }
        } catch (error) {
          console.error('Error initializing data:', error);
          // Show error to user
          navigate('/', {
            replace: true,
            state: { error: 'Failed to initialize application. Please try again.' }
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initAuth, setUser, initPersonalization, fetchContexts, fetchThreads, navigate]);

  return <>{children}</>;
}