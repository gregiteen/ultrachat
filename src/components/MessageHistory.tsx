import React, { useEffect, useRef, useState } from 'react';
import { useMessageStore, useThreadStore } from '../store/chat';
import { QuoteSpinner } from './QuoteSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, RotateCcw, Bookmark, ChevronLeft, ChevronRight, Globe2, Volume2 } from 'lucide-react';
import { usePromptStore } from '../store/promptStore';
import { useToastStore } from '../store/toastStore';
import { useAudioStore } from '../store/audioStore';
import type { Message, MessageVersion } from '../types';
import { ShareDialog } from './ShareDialog';

const MINIMUM_SPINNER_DURATION = 3000; // 3 seconds minimum for the spinner

export function MessageHistory(): JSX.Element {
  const { messages, loading, error, fetchMessages, regenerateResponse, switchMessageVersion, sendMessage } = useMessageStore();
  const { currentThread } = useThreadStore();
  const { showToast } = useToastStore();
  const { savePrompt } = usePromptStore();
  const { playTextToSpeech, isVoicePlaying, currentVoice, stopVoicePlayback, voiceVolume } = useAudioStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState(0);
  const [shareDialogContent, setShareDialogContent] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle spinner timing
  useEffect(() => {
    if (loading) {
      setShowSpinner(true);
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
    } else {
      spinnerTimeoutRef.current = setTimeout(() => {
        setShowSpinner(false);
      }, MINIMUM_SPINNER_DURATION);
    }

    return () => {
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
      }
    };
  }, [loading]);

  // Track streaming progress
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      setStreamingMessageId(lastMessage.id);
      setStreamProgress(0);
      
      const totalLength = lastMessage.content.length;
      const interval = setInterval(() => {
        setStreamProgress(prev => Math.min(prev + (totalLength / 50), totalLength));
      }, 50);

      return () => clearInterval(interval);
    }
    setStreamingMessageId(null);
  }, [messages]);

  // Handle response actions
  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!', 'success');
  };

  const handleShare = (content: string) => {
    setShareDialogContent(content);
    showToast('Share dialog opened', 'info');
  };

  const handleSavePrompt = async (content: string) => {
    try {
      const title = content.split('\n')[0].slice(0, 50).trim();
      await savePrompt(content, title);
      showToast('Prompt saved to library!', 'success');
    } catch (error) {
      console.error('Error saving prompt:', error);
      showToast(
        error instanceof Error 
          ? error.message 
          : 'Failed to save prompt',
        'error'
      );
    }
  };

  const handleReadAloud = async (message: Message) => {
    try {
      // If this message is currently playing, stop it
      // Don't allow TTS if voice volume is muted
      if (voiceVolume === 0) {
        showToast('Voice volume is muted', 'info');
        return;
      }
      if (currentVoice?.id === message.id) {
        await stopVoicePlayback(message.id);
        showToast('Stopped reading', 'info');
        return;
      }

      // If another message is playing, stop it first
      if (currentVoice) {
        await stopVoicePlayback(currentVoice.id);
      }

      // Start playing this message
      await playTextToSpeech(message.content, message.id);
      showToast('Reading message aloud', 'success');

    } catch (error) {
      console.error('Error playing text-to-speech:', error);
      showToast(
        error instanceof Error 
          ? error.message 
          : 'Failed to play text-to-speech',
        'error'
      );
    }
  };

  const handleSearchResubmit = async (message: Message) => {
    try {
      showToast('Resubmitting with search...', 'info');
      
      // Get the original user message that prompted this response
      const prevMessage = messages[messages.findIndex(m => m.id === message.id) - 1];
      if (!prevMessage) throw new Error('Original message not found');
      
      // Resubmit with search enabled
      await sendMessage(
        prevMessage.content,
        [],
        message.context_id,
        false,
        false,
        true // Force search
      );
    } catch (error) {
      console.error('Error resubmitting with search:', error);
      showToast(
        error instanceof Error 
          ? error.message 
          : 'Failed to resubmit with search',
        'error'
      );
    }
  };

  const getCurrentVersion = (message: Message): number => 
    message.versions?.find(v => v.is_current)?.version_number || message.version_count;

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentThread) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a chat or start a new one
      </div>
    );
  }

  if (messages.length === 0 && !showSpinner) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 rounded-2xl shadow-lg transform transition-all duration-200 hover:shadow-xl ${
                message.role === 'user'
                  ? 'bg-primary text-white ml-12'
                  : 'bg-white mr-12'
              }`}
            >
              {/* Message Content */}
              <div className="p-4">
                {message.role === 'user' ? (
                  <div className="prose prose-sm">
                    {message.content}
                    {/* Save Prompt Button */}
                    <button
                      onClick={() => handleSavePrompt(message.content)}
                      className="ml-2 p-1 text-white/70 hover:text-white transition-colors"
                      title="Save prompt"
                    >
                      <Bookmark size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content.slice(0, streamingMessageId === message.id ? streamProgress : undefined)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Response Actions */}
              {message.role === 'assistant' && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => regenerateResponse(message.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Regenerate response"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleShare(message.content)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Share response"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleReadAloud(message)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title={currentVoice?.id === message.id ? 'Stop reading' : 'Read aloud'}
                      disabled={(isVoicePlaying && currentVoice?.id !== message.id) || voiceVolume === 0}
                    >
                      <Volume2 
                        size={16} 
                        className={currentVoice?.id === message.id ? 'text-primary' : ''}
                      />
                    </button>
                    <button
                      onClick={() => handleSearchResubmit(message)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Resubmit with search"
                    >
                      <Globe2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Previous version"
                      onClick={() => {
                        const currentVersion = getCurrentVersion(message);
                        if (currentVersion > 1) {
                          switchMessageVersion(message.id, currentVersion - 1);
                        }
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-gray-500">v{getCurrentVersion(message)}</span>
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        const currentVersion = getCurrentVersion(message);
                        if (currentVersion < message.version_count) {
                          switchMessageVersion(message.id, currentVersion + 1);
                        }
                      }}
                      title="Next version"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading Spinner */}
      <AnimatePresence>
        {showSpinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center"
          >
            <QuoteSpinner />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />

      {/* Share Dialog */}
      {shareDialogContent && (
        <ShareDialog
          isOpen={true}
          onClose={() => setShareDialogContent(null)}
          content={shareDialogContent}
        />
      )}
    </div>
  );
}