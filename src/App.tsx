import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { useAuthStore } from './store/auth';
import { AuthProvider } from './providers/AuthProvider';
import { Spinner } from './design-system/components/feedback/Spinner';
import { registerCleanupHandlers } from './lib/cleanup';

// Lazy load components
const Chat = lazy(() => import('./pages/Chat'));
const Auth = lazy(() => import('./pages/Auth'));
const Landing = lazy(() => import('./pages/Landing'));
const Tasks = lazy(() => import('./pages/Tasks'));
const UnifiedInbox = lazy(() => import('./pages/UnifiedInbox'));
const Account = lazy(() => import('./pages/Account'));
const Voices = lazy(() => import('./pages/Voices'));
const Browse = lazy(() => import('./pages/Browse'));
const AppLayout = lazy(() => import('./components/AppLayout'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <Spinner className="h-8 w-8 text-primary" />
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    </div>
  </div>
);

// Route guard component
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();
  const publicPaths = ['/', '/auth'];

  // Don't guard public paths
  if (publicPaths.includes(location.pathname)) {
    // If user is logged in and trying to access public paths, redirect to chat
    if (initialized && user) {
      return <Navigate to="/chat" replace />;
    }
    return <>{children}</>;
  }

  // For private paths
  if (initialized && !user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Register cleanup handlers on mount
  useEffect(() => {
    console.log('Registering cleanup handlers');
    const cleanup = registerCleanupHandlers();
    return cleanup;
  }, []);

  console.log('App rendering');
  
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={
                    <RouteGuard>
                      <Landing />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/auth" 
                  element={
                    <RouteGuard>
                      <Auth />
                    </RouteGuard>
                  } 
                />

                {/* Private Routes */}
                <Route
                  path="/chat"
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <Chat />
                      </AppLayout>
                    </RouteGuard>
                  }
                />
                <Route 
                  path="/tasks" 
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <Tasks />
                      </AppLayout>
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/inbox" 
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <UnifiedInbox />
                      </AppLayout>
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/account" 
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <Account />
                      </AppLayout>
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/voices" 
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <Voices />
                      </AppLayout>
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/browse" 
                  element={
                    <RouteGuard>
                      <AppLayout>
                        <Browse />
                      </AppLayout>
                    </RouteGuard>
                  } 
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
