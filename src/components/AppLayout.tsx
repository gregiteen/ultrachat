import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Inbox, CheckSquare, User, LogOut, Globe, Volume2, Music2 } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { GlobalAudioPlayer } from './audio/GlobalAudioPlayer';
import { AudioLibrary } from './audio/AudioLibrary';
import type { Track } from '../types/audio';
import { usePersonalizationStore } from '../store/personalization';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, isActive, onClick }: NavItemProps) {
  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-button-text'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <Link to={to}>{content}</Link>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const { user, signOut } = useAuthStore();
  const { activeContext } = usePersonalizationStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setQueue(prev => {
      if (!prev.some(t => t.id === track.id)) {
        return [...prev, track];
      }
      return prev;
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-muted p-4">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/uc.svg" alt="Logo" className="h-8 w-8" />
              <span className="text-lg font-semibold">UltraChat</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <NavItem
              to="/chat"
              icon={<MessageSquare className="h-5 w-5" />}
              label="Chat"
              isActive={location.pathname === '/chat'}
            />
            <NavItem
              to="/inbox"
              icon={<Inbox className="h-5 w-5" />}
              label="Inbox"
              isActive={location.pathname === '/inbox'}
            />
            <NavItem
              to="/tasks"
              icon={<CheckSquare className="h-5 w-5" />}
              label="Tasks"
              isActive={location.pathname === '/tasks'}
            />
            <NavItem
              to="/voices"
              icon={<Volume2 className="h-5 w-5" />}
              label="Voices"
              isActive={location.pathname === '/voices'}
            />
            <NavItem
              to="/browse"
              icon={<Globe className="h-5 w-5" />}
              label="Browse"
              isActive={location.pathname === '/browse'}
            />
            <NavItem
              to="#"
              onClick={() => setIsLibraryOpen(true)}
              icon={<Music2 className="h-5 w-5" />}
              label="Audio Library"
              isActive={false}
            />
          </nav>

          {/* User Section */}
          <div className="space-y-1">
            <NavItem
              to="/account"
              icon={<User className="h-5 w-5" />}
              label="Account"
              isActive={location.pathname === '/account'}
            />
            <NavItem
              to="#"
              onClick={handleSignOut}
              icon={<LogOut className="h-5 w-5" />}
              label="Sign Out"
              isActive={false}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Global Audio Player */}
      <GlobalAudioPlayer
        onLibraryOpen={() => setIsLibraryOpen(true)}
      />

      {/* Audio Library */}
      <AudioLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onTrackSelect={handleTrackSelect}
        currentTrack={currentTrack}
      />
    </div>
  );
}