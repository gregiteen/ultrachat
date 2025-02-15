import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { usePersonalizationStore } from '../store/personalization';
import type { Context } from '../types';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ChatHistory } from '../components/ChatHistory';
import { Settings } from '../components/Settings';
import { ContextSelector } from '../components/ContextSelector';
import ContextEditor from '../components/ContextEditor';
import { PersonalizationButton } from '../components/PersonalizationButton';
import { PersonalizationWelcome } from '../components/PersonalizationWelcome';
import { MessageSquare, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Chat() {
  const navigate = useNavigate();
  const { messages, loading, error, streamingMessageId, sendMessage, fetchMessages, fetchThreads, clearMessages } = useChatStore();
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const { isActive, hasSeenWelcome, togglePersonalization, setHasSeenWelcome } = usePersonalizationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);

  useEffect(() => {
    fetchThreads().catch(console.error);
  }, [fetchThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log("Chat.tsx hasSeenWelcome:", hasSeenWelcome);
  }, [hasSeenWelcome]);

  const handleNewChat = () => {
    clearMessages();
    setSendError(null);
  };

  const handleSendMessage = async (content: string, files?: string[]) => {
    setSendError(null);
    try {
      await sendMessage(content, files, activeContext?.id);
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
    clearMessages();
  };

  const handlePersonalization = () => {
    navigate('/account?tab=personalization');
  };

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
        {(error || sendError) && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error || sendError}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Start a new conversation</p>
              <p className="text-sm">Type a message to begin chatting</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
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
                isLoading={loading}
                isVoiceToTextMode={isVoiceToTextMode}
                setIsVoiceToTextMode={setIsVoiceToTextMode}
                isVoiceToVoiceMode={isVoiceToVoiceMode}
                setIsVoiceToVoiceMode={setIsVoiceToVoiceMode}
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
      {!hasSeenWelcome && (
        <PersonalizationWelcome
          onClose={() => setHasSeenWelcome(true)}
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