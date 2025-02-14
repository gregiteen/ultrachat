import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useSettingsStore } from './store/settings';
import { supabase } from './lib/supabase';
import { applyTheme } from './lib/themes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/AppLayout';

// Lazy load components
const Landing = React.lazy(() => import('./pages/Landing'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Chat = React.lazy(() => import('./pages/Chat'));
const UnifiedInbox = React.lazy(() => import('./pages/UnifiedInbox'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Account = React.lazy(() => import('./pages/Account'));

function App() {
  const { user, setUser, loading } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      fetchSettings().catch(console.error);
    }
  }, [user, fetchSettings]);

  // Apply theme when settings change
  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <React.Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/chat" replace /> : <Landing />}
            />
            <Route
              path="/auth"
              element={user ? <Navigate to="/chat" replace /> : <Auth />}
            />
            <Route
              path="/chat"
              element={
                user ? (
                  <AppLayout>
                    <Chat />
                  </AppLayout>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/inbox"
              element={
                user ? (
                  <AppLayout>
                    <UnifiedInbox />
                  </AppLayout>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/tasks"
              element={
                user ? (
                  <AppLayout>
                    <Tasks />
                  </AppLayout>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/account"
              element={
                user ? (
                  <AppLayout>
                    <Account />
                  </AppLayout>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
          </Routes>
        </React.Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;