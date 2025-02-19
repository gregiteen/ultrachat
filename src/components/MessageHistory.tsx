import React, { useEffect, useRef, useState } from 'react';
import { useMessageStore } from '../store/messageStore';
import { useThreadStore } from '../store/threadStore';
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
import { getChatModel } from '../lib/gemini';

const MINIMUM_SPINNER_DURATION = 500; // 0.5 seconds minimum for the spinner

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

  // Load messages when thread changes
  useEffect(() => {
    if (currentThread?.id) {
      fetchMessages(currentThread.id).catch(error => {
        console.error('Error fetching messages:', error);
      });
    }
  }, [currentThread?.id, fetchMessages]);

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

  // Handle response actions
  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    showToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const handleShare = (content: string) => {
    setShareDialogContent(content);
    showToast({ message: 'Share dialog opened', type: 'info' });
  };

  const generatePromptTitle = async (content: string): Promise<string> => {
    try {
      const model = getChatModel();
      const result = await model.generateText(
        `Generate a concise title (max 50 chars) that describes what this prompt does: "${content}"\n` +
        `Format: Just return the title, nothing else.`
      );
      const title = result.trim();
      return title.length > 50 ? title.slice(0, 47) + '...' : title;
    } catch (error) {
      console.error('Error generating title:', error);
      return content.split('\n')[0].slice(0, 47) + '...';
    }
  };

  const handleSavePrompt = async (content: string) => {
    try {
      // Get metadata from current context
      const metadata = {
        assistant: currentThread?.context_id,
        personalization: currentThread?.personalization_enabled,
        search: currentThread?.search_enabled,
        tools: currentThread?.tools_used
      };
      
      const title = await generatePromptTitle(content);
      await savePrompt(content, title, metadata);
      showToast({ message: 'Prompt saved to library!', type: 'success' });
    } catch (error) {
      console.error('Error saving prompt:', error);
      showToast({ 
        message: error instanceof Error ? error.message : 'Failed to save prompt',
        type: 'error'
      });
    }
  };

  const handleReadAloud = async (message: Message) => {
    try {
      // If this message is currently playing, stop it
      // Don't allow TTS if voice volume is muted
      if (voiceVolume === 0) {
        showToast({ message: 'Voice volume is muted', type: 'info' });
        return;
      }
      if (currentVoice?.id === message.id) {
        await stopVoicePlayback(message.id);
        showToast({ message: 'Stopped reading', type: 'info' });
        return;
      }

      // If another message is playing, stop it first
      if (currentVoice) {
        await stopVoicePlayback(currentVoice.id);
      }

      // Start playing this message
      await playTextToSpeech(message.content, message.id);
      showToast({ message: 'Reading message aloud', type: 'success' });

    } catch (error) {
      console.error('Error playing text-to-speech:', error);
      showToast({ 
        message: error instanceof Error ? error.message : 'Failed to play text-to-speech',
        type: 'error'
      });
    }
  };

  const handleSearchResubmit = async (message: Message) => {
    try {
      showToast({ message: 'Resubmitting with search...', type: 'info' });
      
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
      showToast({ 
        message: error instanceof Error ? error.message : 'Failed to resubmit with search',
        type: 'error'
      });
    }
  };

  const getCurrentVersion = (message: Message): number => {
    return message.version_count || 1;
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
              className={`max-w-3/4 shadow-lg transform transition-all duration-200 hover:shadow-xl ${
                message.role === 'user'
                  ? 'bg-primary text-white ml-12 rounded-[24px] rounded-br-lg'
                  : 'bg-white mr-12 rounded-[24px] rounded-bl-lg'
              } overflow-hidden`}
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
                      {message.content}
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
                        if (currentVersion > 1 && message.version_count && currentVersion <= message.version_count) {
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
                        if (message.version_count && currentVersion < message.version_count) {
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