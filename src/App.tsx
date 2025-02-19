import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { AuthGuard } from './components/AuthGuard';
import { Spinner } from './design-system/components/feedback/Spinner';

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

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Landing />
              </AuthGuard>
            } 
          />
          <Route 
            path="/auth" 
            element={
              <AuthGuard>
                <Auth />
              </AuthGuard>
            } 
          />

          {/* Private Routes */}
          <Route
            path="/chat"
            element={
              <AuthGuard>
                <AppLayout>
                  <Chat />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route 
            path="/tasks" 
            element={
              <AuthGuard>
                <AppLayout>
                  <Tasks />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/inbox" 
            element={
              <AuthGuard>
                <AppLayout>
                  <UnifiedInbox />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/account" 
            element={
              <AuthGuard>
                <AppLayout>
                  <Account />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/voices" 
            element={
              <AuthGuard>
                <AppLayout>
                  <Voices />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/browse" 
            element={
              <AuthGuard>
                <AppLayout>
                  <Browse />
                </AppLayout>
              </AuthGuard>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
