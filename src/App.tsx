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
  const { user } = useAuthStore();
  const { fetchPersonalInfo } = usePersonalizationStore();

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

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App;