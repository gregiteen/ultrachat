import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { usePersonalizationStore } from '../store/personalization';
import type { Context } from '../types';
import { ChatInput } from '../components/ChatInput';
import { ChatHistory } from '../components/ChatHistory';
import { Settings } from '../components/Settings';
import { ContextSelector } from '../components/ContextSelector';
import ContextEditor from '../components/ContextEditor';
import { PersonalizationButton } from '../components/PersonalizationButton';
import { PersonalizationWelcome } from '../components/PersonalizationWelcome';
import { MessageSquare, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSettingsStore } from '../store/settings';
import VirtualizedChatHistory from '../components/VirtualizedChatHistory';

export default function Chat() {
  const navigate = useNavigate();
  const { loading: messageLoading, error: messageError, sendMessage, clearThreadMessages } = useMessageStore();
  const { fetchThreads } = useThreadStore();
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const { loading: authLoading } = useAuthStore();
  const { isActive, hasSeenWelcome, snoozedForSession, togglePersonalization, personalInfo, setHasSeenWelcome, initialized } = usePersonalizationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);

  const [isInitializing, setIsInitializing] = useState(true);

  const { settings } = useSettingsStore();

  useEffect(() => {
    fetchThreads().catch(console.error);
  }, [fetchThreads]);

  useEffect(() => {
    console.log('Auth loading:', authLoading, 'Initialized:', initialized);
    if (!authLoading) {
      setIsInitializing(false);
    }
  }, [authLoading]);

  const handleNewChat = () => {
    const currentThreadId = useThreadStore.getState().currentThreadId;
    if (currentThreadId) {
      clearThreadMessages(currentThreadId);
    }
    setSendError(null);
  };

  const handleSendMessage = async (content: string, files?: string[], contextId?: string, isSystemMessage: boolean = false) => {
    setSendError(null);
    try {
      await sendMessage(content, files, isSystemMessage ? undefined : activeContext?.id, isSystemMessage);
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

  const handlePersonalization = () => {
    navigate('/account?tab=personalization');
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-lg hover:bg-secondary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </button>
        </div>
        <ChatHistory />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          <VirtualizedChatHistory />
        </div>

        {/* Context Selector and Input */}
        <div className="p-6 space-y-4">
          <ContextSelector
            contexts={contexts}
            activeContext={activeContext}
            onContextChange={handleContextChange}
            onEditContext={handleEditContext}
          />

          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <PersonalizationButton
                isActive={isActive}
                onToggle={togglePersonalization}
                onClick={handlePersonalization}
              />
            </div>
            <div className="pl-12">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={messageLoading}
                isVoiceToTextMode={isActive && isVoiceToTextMode}
                setIsVoiceToTextMode={(enabled) => isActive && setIsVoiceToTextMode(enabled)}
                isVoiceToVoiceMode={isActive && isVoiceToVoiceMode}
                setIsVoiceToVoiceMode={(enabled) => isActive && setIsVoiceToVoiceMode(enabled)}
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
      {initialized && !hasSeenWelcome && !snoozedForSession && !hasPersonalInfo() && !isInitializing && (
        <PersonalizationWelcome 
          onClose={handleWelcomeClose} 
          onSetup={() => {
            handleSetupPersonalization();
          }}
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