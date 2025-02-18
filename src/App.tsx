import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { useAuthStore } from './store/auth';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeDemo } from './design-system/components/ThemeDemo';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Tasks from './pages/Tasks';
import UnifiedInbox from './pages/UnifiedInbox';
import Account from './pages/Account';
import Voices from './pages/Voices';
import Browse from './pages/Browse';
import AppLayout from './components/AppLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Initializing...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Initializing...
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}

function App() {

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } 
              />
              {/* Private Routes */}
              <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Chat />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route 
                path="/tasks" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Tasks />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/inbox" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <UnifiedInbox />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Account />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/voices" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Voices />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/browse" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Browse />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/theme-demo" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <ThemeDemo />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
