import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Inbox, CheckSquare, Mic, Globe, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThreadStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { usePersonalizationStore } from '../store/personalization';
import { useSettingsStore } from '../store/settings';

const navItems = [
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/inbox', icon: Inbox, label: 'Inbox' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/voices', icon: Mic, label: 'Voices' },
  { path: '/browse', icon: Globe, label: 'Browse' },
  { path: '/account', icon: Settings, label: 'Settings' },
];

export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, initialized: authInitialized } = useAuthStore();
  const { initialized: threadsInitialized } = useThreadStore();
  const { initialized: contextsInitialized } = useContextStore();
  const { initialized: personalizationInitialized } = usePersonalizationStore();

  // Check if all required stores are initialized
  const isFullyInitialized = authInitialized && threadsInitialized && contextsInitialized && personalizationInitialized;

  const handleSignOut = async () => {
    try {
      // Sign out from auth first
      await signOut();
      
      // Then clear all store states
      useThreadStore.setState({ threads: [], currentThread: null, error: null, initialized: false });
      useContextStore.setState({ contexts: [], activeContext: undefined, error: null, initialized: false });
      usePersonalizationStore.setState({ personalInfo: undefined, isActive: false, hasSeenWelcome: false, initialized: false });
      useSettingsStore.setState({ settings: undefined });
      
      
      // Navigate to home
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isFullyInitialized) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-muted z-50 px-4">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/uc.svg" alt="UC" className="h-12 w-auto" />
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}