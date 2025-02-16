import React, { useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { MessageSquare, Inbox, CheckSquare, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { applyTheme, removeTheme } from '../lib/themes';

export function AppLayout() {
  const { signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  useLayoutEffect(() => {
    if (settings?.theme && location.pathname !== '/' && location.pathname !== '/auth') {
      console.log("AppLayout.tsx - Applying theme:", settings.theme);
      applyTheme(settings.theme);
    }
    return () => {
      console.log("AppLayout.tsx - Removing theme");
      removeTheme();
    }
  }, [settings, location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut(() => {
      navigate('/auth');
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
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
                className={`text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 ${
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
                className={`text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 ${
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
                className={`text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 ${
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
                className={`text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 ${
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
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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
        {location.pathname !== '/' && location.pathname !== '/auth' ? (
          <div className="theme-applied bg-background"><Outlet /></div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}