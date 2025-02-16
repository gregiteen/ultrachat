import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeDemo } from './design-system/components/ThemeDemo';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Tasks from './pages/Tasks';
import UnifiedInbox from './pages/UnifiedInbox';
import Account from './pages/Account';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/theme-demo" element={<AppLayout><ThemeDemo /></AppLayout>} />
              <Route
                path="/chat"
                element={
                  <AppLayout>
                    <Chat />
                  </AppLayout>
                }
              />
              <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
              <Route path="/inbox" element={<AppLayout><UnifiedInbox /></AppLayout>} />
              <Route path="/account" element={<AppLayout><Account /></AppLayout>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;