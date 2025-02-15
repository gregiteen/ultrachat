import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { MessageSquare, Inbox, CheckSquare, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface AppLayoutProps {
  // children: React.ReactNode; // Removing the children prop
}

export function AppLayout({  }: AppLayoutProps) { // No more children prop
  const { signOut } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="https://imgur.com/EJ0T2co.png" alt="UltraChat" className="h-12 w-auto" />
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <Link
                to="/chat"
                className={`text-sm font-medium transition-colors ${
                  isActive('/chat')
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </span>
              </Link>
              <Link
                to="/inbox"
                className={`text-sm font-medium transition-colors ${
                  isActive('/inbox')
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </span>
              </Link>
              <Link
                to="/tasks"
                className={`text-sm font-medium transition-colors ${
                  isActive('/tasks')
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </span>
              </Link>
              <Link
                to="/account"
                className={`text-sm font-medium transition-colors ${
                  isActive('/account')
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Account
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {/* @ts-ignore */}
        <Outlet />
      </main>
    </div>
  );
}