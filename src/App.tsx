import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Route, Outlet } from 'react-router-dom';
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
import { applyTheme, removeTheme } from './lib/themes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
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
        element: <Tasks />,
      },
      {
        path: 'inbox',
        element: <UnifiedInbox />,
      },
    ],
  },
  {
    path: '/auth',
    element: <Auth />,
  },
]);

function App() {
  const { loading: authLoading, user } = useAuthStore();
  const { fetchPersonalInfo } = usePersonalizationStore();
  const { settings } = useSettingsStore();

    useEffect(() => {
        const { unsubscribe } = onAuthStateChange(() => {});

        // Fetch user data after auth state is determined
        if (user) {
            fetchPersonalInfo();
        }

        // Cleanup function to unsubscribe when the component unmounts
        return () => {
            unsubscribe();
        };
    }, [user, fetchPersonalInfo]);

    useEffect(() => {
      if (settings?.theme) {
        applyTheme(settings.theme);
      }
      return () => {
        removeTheme();
      }
    }, [settings]);


  if (authLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ErrorBoundary>
      <div className="theme-applied">
        <RouterProvider router={router} />
      </div>
    </ErrorBoundary>
  );
}

export default App;