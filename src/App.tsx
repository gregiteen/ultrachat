import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import Account from './pages/Account';
import Landing from './pages/Landing';
import Tasks from './pages/Tasks';
import UnifiedInbox from './pages/UnifiedInbox';
import { AppLayout } from './components/AppLayout';
import { onAuthStateChange } from './lib/supabase';
import { useAuthStore } from './store/auth';
import { usePersonalizationStore } from './store/personalization';
import { useSettingsStore } from './store/settings';
import { useUnifiedInboxStore } from './store/unified-inbox';

console.log('App.tsx - Starting router configuration');

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [ // These are the app routes that should have theme applied
      {
        path: '', // Empty path for the root within AppLayout (Landing page)
        element: <Landing />,
      },
      {
        path: 'chat',
        element: <Chat />,
      },
      {
        path: 'account',
        element: <Account />,
      },
      {
          path: 'tasks',
          element: <Tasks/>
      },
      {
          path: 'inbox',
          element: <UnifiedInbox/>
      }
    ],
  },
  {
    path: '/auth',
    element: <Auth />,
  },
]);

console.log('App.tsx - Router configured');

function App() {
  console.log('App.tsx - Component mounting');
  
  const { loading: authLoading } = useAuthStore();
  const { fetchPersonalInfo, setInitialized } = usePersonalizationStore();
  const { fetchSettings } = useSettingsStore();
  const { loading: unifiedInboxLoading } = useUnifiedInboxStore();

  console.log('App.tsx - Hooks initialized');

  const { unsubscribe } = onAuthStateChange((event, session) => {
    console.log('App.tsx - Auth state changed:', event);
    if (event === 'SIGNED_IN' || event === "TOKEN_REFRESHED") {
      fetchPersonalInfo();
      fetchSettings();
    }
  });

  // Initialize personalization state on mount
  useEffect(() => {
    const initializePersonalization = async () => {
      await fetchPersonalInfo();
      setInitialized(true);
    };
    initializePersonalization();
  }, [fetchPersonalInfo, setInitialized]);

  useEffect(() => {
    console.log('App.tsx - Setting up auth state change listener');
    return () => {
      console.log('App.tsx - Cleaning up auth state change listener');
      unsubscribe();
    };
  }, [fetchPersonalInfo, fetchSettings]);

  console.log('App.tsx - Loading states:', {
    authLoading,
    personalizationInitialized: usePersonalizationStore.getState().initialized,
    unifiedInboxLoading
  });

  // Only block on auth loading to prevent white screen
  if (authLoading) {
    console.log('App.tsx - Still loading, returning null');
    return null; // Or a loading spinner
  }

  console.log('App.tsx - Rendering router');
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App;