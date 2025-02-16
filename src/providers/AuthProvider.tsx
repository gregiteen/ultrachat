import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase-client';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    console.log('AuthProvider - Initializing auth');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setLoading(true);
        
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
        setInitialized(true);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setInitialized]);

  return <>{children}</>;
}