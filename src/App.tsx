import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './design-system/theme';
import { ThemeDemo } from './design-system/components/ThemeDemo';
import Chat from './pages/Chat';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Tasks from './pages/Tasks';
import UnifiedInbox from './pages/UnifiedInbox';
import Account from './pages/Account';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/inbox" element={<UnifiedInbox />} />
            <Route path="/account" element={<Account />} />
            <Route path="/theme-demo" element={<ThemeDemo />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;