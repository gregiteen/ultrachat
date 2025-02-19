import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { GlobalAudioPlayer } from './audio/GlobalAudioPlayer';
import { AudioLibrary } from './audio/AudioLibrary';
import { type Track } from '../types/audio';
import { usePersonalizationStore } from '../store/personalization';
import { useThreadStore, useMessageStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { useSettingsStore } from '../store/settings';
import { VirtualizedChatHistory } from './VirtualizedChatHistory';
import { PromptLibrary } from './PromptLibrary';
import { PersonalizationChatbot } from './PersonalizationChatbot';
import { Toast, ToastContainer } from '../design-system/components/feedback/Toast';
import { useToastStore } from '../store/toastStore';
import { NavBar } from './NavBar';
import { Spinner } from '../design-system/components/feedback/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  const { signOut, initialized: authInitialized } = useAuthStore();
  const { isActive, hasSeenWelcome, initialized: personalizationInitialized } = usePersonalizationStore();
  const { toasts, removeToast } = useToastStore();
  const { messages } = useMessageStore();
  const { initialized: threadsInitialized, loading: threadsLoading } = useThreadStore();
  const { initialized: contextsInitialized } = useContextStore();

  // Check if all required stores are initialized
  const isFullyInitialized = authInitialized && personalizationInitialized && threadsInitialized && contextsInitialized;
  const isLoading = threadsLoading;

  const handleSignOut = async () => {
    try {
      // Clear all store states
      useThreadStore.setState({ threads: [], currentThread: null, error: null, initialized: false });
      useMessageStore.setState({ messages: [], error: null });
      useContextStore.setState({ contexts: [], activeContext: undefined, error: null, initialized: false });
      usePersonalizationStore.setState({ personalInfo: undefined, isActive: false, hasSeenWelcome: false, initialized: false });
      useSettingsStore.setState({ settings: undefined });
      
      // Sign out from auth
      await signOut();
      
      // Navigate to home
      window.location.href = '/';
      
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

  // Show loading state while initializing
  if (!isFullyInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <div className="text-sm text-muted-foreground">
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16 relative">
        {/* Left Drawer Button */}
        <button
          onClick={() => setIsLeftDrawerOpen(true)}
          className="fixed left-4 top-20 z-50 p-2 rounded-lg bg-background shadow-lg hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Left Drawer (Chat History) */}
        <AnimatePresence>
          {isLeftDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setIsLeftDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="fixed left-0 top-16 bottom-0 w-80 bg-background border-r border-muted z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-muted">
                  <h2 className="text-lg font-semibold">Chat History</h2>
                  <button
                    onClick={() => setIsLeftDrawerOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="h-full overflow-hidden">
                  <VirtualizedChatHistory onThreadSelect={() => setIsLeftDrawerOpen(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Right Drawer Button */}
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="fixed right-4 top-20 z-50 p-2 rounded-lg bg-background shadow-lg hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Right Drawer (Prompt Library) */}
        <AnimatePresence>
          {isRightDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setIsRightDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="fixed right-0 top-16 bottom-0 w-80 bg-background border-l border-muted z-50"
              >
                <PromptLibrary
                  isOpen={true}
                  onClose={() => setIsRightDrawerOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content with Floating Chatbot */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Audio Player */}
      <GlobalAudioPlayer
        onLibraryOpen={() => setIsLibraryOpen(true)}
      />

      {/* Audio Library */}
      <AudioLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onTrackSelect={handleTrackSelect}
        currentTrack={currentTrack || undefined}
      />

      {/* Toast Container */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  );
}