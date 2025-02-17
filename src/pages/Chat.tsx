import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { usePersonalizationStore } from '../store/personalization';
import type { Context } from '../types';
import { ChatInput } from '../components/ChatInput';
import { ChatHistory } from '../components/ChatHistory';
import { MessageHistory } from '../components/MessageHistory';
import { Settings } from '../components/Settings';
import ContextEditor from '../components/ContextEditor';
import { PersonalizationButton } from '../components/PersonalizationButton';
import { PersonalizationWelcome } from '../components/PersonalizationWelcome';
import { MessageSquare, AlertCircle, ChevronRight, ChevronLeft, UserCircle } from 'lucide-react';
import { useSettingsStore } from '../store/settings';

export default function Chat() {
  const navigate = useNavigate();
  const { loading: messageLoading, error: messageError, sendMessage, clearThreadMessages } = useMessageStore();
  const { fetchThreads, currentThreadId } = useThreadStore();
  const { contexts, activeContext, setActiveContext, initialized: contextInitialized, fetchContexts } = useContextStore();
  const { loading: authLoading, initialized: authInitialized, user } = useAuthStore();
  const { isActive, hasSeenWelcome, snoozedForSession, togglePersonalization, personalInfo, setHasSeenWelcome, initialized, init: initPersonalization } = usePersonalizationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [isInitializing, setIsInitializing] = useState(true);

  const { settings } = useSettingsStore();

  // Initialize data when auth is ready
  useEffect(() => {
    if (authInitialized && user) {
      const initialize = async () => {
        try {
          await Promise.all([
            fetchThreads(),
            initPersonalization(),
            fetchContexts()
          ]);
          // Set initialized states
          useThreadStore.setState({ initialized: true });
          useContextStore.setState({ initialized: true });
          usePersonalizationStore.setState({ initialized: true });
        } catch (error) {
          console.error('Error initializing:', error);
          // Still set initialized to prevent infinite loading
          setIsInitializing(false);
        }
      };
      initialize();
    }
  }, [authInitialized, user, fetchThreads, initPersonalization, fetchContexts]);

  // Track initialization state
  useEffect(() => {
    console.log('Auth initialized:', authInitialized, 'Context initialized:', contextInitialized, 'Personalization initialized:', initialized);
    if (authInitialized && contextInitialized && initialized) {
      setIsInitializing(false);
    }
  }, [authInitialized, contextInitialized, initialized]);

  const handleNewChat = () => {
    useThreadStore.getState().switchThread('');
  };

  const handleContinueInPersonalization = () => {
    if (currentThreadId) {
      navigate(`/account?tab=personalization&thread=${currentThreadId}`);
    }
  };

  const handleSendMessage = async (content: string, files?: string[], contextId?: string, isSystemMessage: boolean = false, skipAiResponse: boolean = false, forceSearch: boolean = false) => {
    setSendError(null);
    try {
      await sendMessage(content, files, isSystemMessage ? undefined : activeContext?.id, isSystemMessage, skipAiResponse, forceSearch || isSearchMode);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'An error occurred while sending your message. Please try again.';
      setSendError(errorMessage);
      console.error('Chat error:', error);
    }
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  const handleContextChange = (context: Context | null) => {
    setActiveContext(context);
    const currentThreadId = useThreadStore.getState().currentThreadId;
    if (currentThreadId) {
      clearThreadMessages(currentThreadId);
    }
  };

  const handleWelcomeClose = async () => {
    try {
      await setHasSeenWelcome(false); // Don't permanently dismiss, just snooze for session
      setSendError(null);
    } catch (error) {
      console.error('Error closing welcome:', error);
      setSendError('Failed to update preferences. Please try again.');
    }
  };

  const hasPersonalInfo = () => {
    // Check if any significant fields are filled
    return !!(
      personalInfo.name || personalInfo.email || personalInfo.phone ||
      (personalInfo.interests && personalInfo.interests.length > 0) ||
      personalInfo.backstory || personalInfo.projects || personalInfo.resume
    );
  };

  const handleSetupPersonalization = async () => {
    try {
      navigate('/account?tab=personalization');
      // Only permanently dismiss if there's actual personalization data
      if (hasPersonalInfo()) {
        await setHasSeenWelcome(true);
      } else {
        await setHasSeenWelcome(false); // Just snooze if no data yet
      }
    } catch (error) {
      console.error('Error setting up personalization:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Chat History Drawer */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          drawerOpen ? 'translate-x-0' : '-translate-x-64'
        } w-64 bg-background border-r border-muted transition-transform duration-200 ease-in-out z-40`}
      >
        <div className="p-4 border-b border-muted">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-lg hover:bg-secondary transition-colors mb-2"
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </button>
          {currentThreadId && (
            <button
              onClick={handleContinueInPersonalization}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              title="Continue this chat in the personalization interface"
            >
              <UserCircle className="h-4 w-4" />
              <span className="truncate">
                Continue in Personalization
              </span>
            </button>
          )}
        </div>
        <ChatHistory />
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64 transition-all duration-200 ease-in-out ${drawerOpen ? 'ml-64' : ''}`}>
        {/* Drawer toggle button */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-background border border-muted rounded-r-lg shadow-lg z-50 hover:bg-muted transition-colors"
          aria-label={drawerOpen ? 'Close chat history' : 'Open chat history'}
        >
          {drawerOpen ? (
            <ChevronLeft className="h-5 w-5 text-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-foreground" />
          )}
        </button>

        {/* Error display */}
        {(messageError || sendError) && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{messageError || sendError}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageHistory />
        </div>

        {/* Context Selector and Input */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <PersonalizationButton
                isActive={isActive}
                onToggle={togglePersonalization}
              />
            </div>
            <div className="pl-12">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={messageLoading}
                isVoiceToTextMode={isVoiceToTextMode}
                setIsVoiceToTextMode={(enabled) => isActive && setIsVoiceToTextMode(enabled)}
                isVoiceToVoiceMode={isVoiceToVoiceMode}
                setIsVoiceToVoiceMode={(enabled) => isActive && setIsVoiceToVoiceMode(enabled)}
                isSearchMode={isSearchMode}
                setIsSearchMode={setIsSearchMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Context Editor Modal */}
      {showContextEditor && (
        <ContextEditor
          initialContext={editingContext || undefined}
          onClose={() => {
            setShowContextEditor(false);
            setEditingContext(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Welcome Dialog */}
      {!isInitializing && initialized && !hasSeenWelcome && !snoozedForSession && !hasPersonalInfo() && (
        <PersonalizationWelcome 
          onClose={handleWelcomeClose} 
          onSetup={handleSetupPersonalization}
        />
      )}

      {/* Overlay for mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}