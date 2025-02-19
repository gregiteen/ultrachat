import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Edit, Paperclip, Image, Command, Search, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContextStore } from '../store/context';
import { useThreadStore } from '../store/chat';
import type { Context } from '../types';
import { VoiceRecorder } from './VoiceRecorder';
import { speechRecognition } from '../lib/speech';
import { supabase } from '../lib/supabase';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { PersonalizationButton } from './PersonalizationButton';
import ContextEditor from './ContextEditor';
import { PromptLibrary } from './PromptLibrary';
import { useAudioStore } from '../store/audioStore';
import { usePromptStore } from '../store/promptStore';
import { useToastStore } from '../store/toastStore';
import { usePersonalizationStore } from '../store/personalization';

interface ChatInputProps {
  onSendMessage: (content: string, files?: string[], contextId?: string, isSystemMessage?: boolean, skipAiResponse?: boolean, forceSearch?: boolean, metadata?: { personalization_enabled?: boolean; search_enabled?: boolean; tools_used?: string[] }) => Promise<void>;
  isLoading?: boolean;
  isVoiceToTextMode?: boolean;
  setIsVoiceToTextMode?: (value: boolean) => void;
  isVoiceToVoiceMode?: boolean;
  setIsVoiceToVoiceMode?: (value: boolean) => void;
  isSearchMode?: boolean;
  setIsSearchMode?: (value: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  isVoiceToTextMode = false,
  setIsVoiceToTextMode,
  isVoiceToVoiceMode = false,
  setIsVoiceToVoiceMode,
  isSearchMode = false,
  setIsSearchMode,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { contexts, activeContext, setActiveContext, initialized: contextsInitialized } = useContextStore();
  const { initialized: threadsInitialized } = useThreadStore();
  const { isActive, togglePersonalization } = usePersonalizationStore();
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | undefined>(undefined);
  const [transcribedText, setTranscribedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const { isVoicePlaying, playTextToSpeech } = useAudioStore();
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { savePrompt } = usePromptStore();
  const { showToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if all required stores are initialized
  const isFullyInitialized = contextsInitialized && threadsInitialized;
  const isToggleDisabled = disabled || isUploading;
  const isDisabled = disabled || !isFullyInitialized || isUploading;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    };

    textarea.addEventListener('input', adjustHeight);
    adjustHeight(); // Initial adjustment

    return () => textarea.removeEventListener('input', adjustHeight);
  }, [message]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setIsUploading(true);
      try {
        const paths = await Promise.all(
          files.map(async (file) => {
            const filePath = `${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('user-uploads')
              .upload(filePath, file);
            if (uploadError) {
              console.error('Upload error:', uploadError);
              showToast({
                message: `Failed to upload ${file.name}: ${uploadError.message}`,
                type: 'error',
                duration: 5000
              });
              return null;
            }
            return filePath;
          })
        );
        const successfulUploads = paths.filter((path): path is string => path !== null);
        setFilePaths(prev => [...prev, ...successfulUploads]);
        
        if (successfulUploads.length > 0) {
          showToast({
            message: `Successfully uploaded ${successfulUploads.length} file(s)`,
            type: 'success',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        showToast({
          message: 'An unexpected error occurred while uploading files',
          type: 'error',
          duration: 5000
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || isDisabled) return;

    const currentMessage = message;
    setMessage('');
    setTranscribedText('');
    
    try {
      // Update thread metadata
      const metadata = {
        personalization_enabled: isActive,
        search_enabled: isSearchMode,
        tools_used: []
      };
      
      await onSendMessage(currentMessage, filePaths, activeContext?.id, false, false, isSearchMode, metadata);
      setFilePaths([]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(currentMessage);
      showToast({
        message: 'Failed to send message. Please try again.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  const processVoiceRecording = async (text: string) => {
    try {
      if (isVoiceToVoiceMode && activeContext?.voice?.id) {
        await playTextToSpeech(text, `voice-response-${Date.now()}`);
      } 

      // Update thread metadata
      const metadata = {
        personalization_enabled: isActive,
        search_enabled: isSearchMode,
        tools_used: []
      };

      await onSendMessage(text, [], activeContext?.id, false, false, isSearchMode, metadata);
      setTranscribedText('');
    } catch (error) {
      console.error('Error processing voice:', error);
      setSpeechRecognitionError('Error processing voice');
      showToast({
        message: 'Failed to process voice recording. Please try again.',
        type: 'error',
        duration: 5000
      });
    }
  };

  const handleVoiceRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    try {
      await speechRecognition.startRecording((result, isFinal) => {
        if (isFinal) {
          setTranscribedText(result);
          speechRecognition.stopRecording();
          processVoiceRecording(result);
        } else {
          setTranscribedText(result);
        }
      });
    } catch (error) {
      console.error('Error transcribing voice recording:', error);
      setSpeechRecognitionError('Error processing voice recording');
      showToast({
        message: 'Failed to transcribe voice recording. Please try again.',
        type: 'error',
        duration: 5000
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 space-y-2 overflow-hidden bg-background/95 backdrop-blur-sm border-b border-muted"
          >
            <div className="flex flex-wrap gap-2">
              {contexts.map((context) => (
                <motion.button
                  key={context.id}
                  onClick={() => setActiveContext(context)}
                  className={`group relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeContext?.id === context.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted hover:bg-muted-foreground/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDisabled}
                >
                  {context.name}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContext(context);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1"
                    whileHover={{ scale: 1.1 }}
                    disabled={isDisabled}
                  >
                    <Edit className="h-3 w-3" />
                  </motion.button>
                </motion.button>
              ))}
              <motion.button
                onClick={() => {
                  setEditingContext(undefined);
                  setShowContextEditor(true);
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                whileHover={isDisabled ? {} : { scale: 1.02 }}
                whileTap={isDisabled ? {} : { scale: 0.98 }}
                disabled={isDisabled}
              >
                + New Assistant
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <motion.div
          className={`relative flex items-end gap-2 rounded-xl border border-muted bg-input-background p-3 shadow-sm transition-all ${
            isDisabled ? 'opacity-75' : 'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50'
          }`}
        >
          <PersonalizationButton
            isActive={isActive}
            onToggle={async () => {
              await togglePersonalization();
            }}
          />

          <motion.button
            type="button"
            onClick={() => setShowContextMenu(!showContextMenu)}
            className={`flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${
              showContextMenu ? 'bg-primary/10 text-primary' : ''
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={isDisabled ? {} : { scale: 1.05 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
            disabled={isDisabled}
          >
            <Command className="h-5 w-5" />
          </motion.button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".pdf, .txt, .md, .csv, .json, .xml, audio/*, video/*"
            disabled={isDisabled}
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*"
            capture="environment"
            disabled={isDisabled}
          />

          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={transcribedText || (isSearchMode ? "Ask a question..." : "Type a message...")}
              className={`w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-1 px-2 resize-none overflow-hidden ${
                isDisabled ? 'cursor-not-allowed' : ''
              }`}
              style={{
                minHeight: '24px',
                maxHeight: '200px',
              }}
              disabled={isVoiceToVoiceMode || isDisabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${
                isDisabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isDisabled || isUploading}
              whileHover={isDisabled || isUploading ? {} : { scale: 1.05 }}
              whileTap={isDisabled || isUploading ? {} : { scale: 0.95 }}
            >
              {isUploading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${
                isDisabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isDisabled || isUploading}
              whileHover={isDisabled || isUploading ? {} : { scale: 1.05 }}
              whileTap={isDisabled || isUploading ? {} : { scale: 0.95 }}
            >
              {isUploading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Image className="h-5 w-5" />
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => {
                if (setIsVoiceToTextMode) {
                  const newMode = !isVoiceToTextMode;
                  setIsVoiceToTextMode(newMode);
                  if (newMode && isVoiceToVoiceMode && setIsVoiceToVoiceMode) {
                    setIsVoiceToVoiceMode(false);
                  }
                  if (!newMode) {
                    setTranscribedText('');
                  }
                }
              }}
              className={`transition-colors p-2 rounded-lg ${
                isVoiceToTextMode
                  ? 'text-primary bg-primary/10'
                  : 'text-icon-color hover:text-icon-hover'
              } ${(isRecording || isDisabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={(isRecording || isDisabled) ? {} : { scale: 1.05 }}
              whileTap={(isRecording || isDisabled) ? {} : { scale: 0.95 }}
              disabled={isRecording || isDisabled}
            >
              <Mic className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => {
                if (setIsVoiceToVoiceMode) {
                  const newMode = !isVoiceToVoiceMode;
                  setIsVoiceToVoiceMode(newMode);
                  if (newMode && isVoiceToTextMode && setIsVoiceToTextMode) {
                    setIsVoiceToTextMode(false);
                  }
                  if (!newMode) {
                    setTranscribedText('');
                  }
                }
              }}
              className={`transition-colors p-2 rounded-lg ${
                isVoiceToVoiceMode
                  ? 'text-primary bg-primary/10'
                  : 'text-icon-color hover:text-icon-hover'
              } ${(!activeContext?.voice?.id || isRecording || isDisabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={(!activeContext?.voice?.id || isRecording || isDisabled) ? {} : { scale: 1.05 }}
              whileTap={(!activeContext?.voice?.id || isRecording || isDisabled) ? {} : { scale: 0.95 }}
              disabled={!activeContext?.voice?.id || isRecording || isDisabled}
            >
              <Volume2 className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setShowPromptLibrary(true)}
              className={`transition-colors p-2 rounded-lg ${
                showPromptLibrary
                  ? 'text-primary bg-primary/10'
                  : 'text-icon-color hover:text-icon-hover'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Prompt Library"
              disabled={isDisabled}
              whileHover={isDisabled ? {} : { scale: 1.05 }}
              whileTap={isDisabled ? {} : { scale: 0.95 }}
            >
              <HelpCircle className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setIsSearchMode?.(!isSearchMode)}
              aria-label={isSearchMode ? 'Search mode enabled' : 'Search mode disabled'}
              className={`transition-colors p-2 rounded-lg ${
                isSearchMode
                  ? 'text-green-500 bg-green-500/20 scale-110'
                  : 'text-icon-color hover:text-icon-hover hover:bg-muted/10'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isDisabled ? {} : { scale: 1.05 }}
              whileTap={isDisabled ? {} : { scale: 0.95 }}
              disabled={isToggleDisabled}
            >
              {isLoading && isSearchMode ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </motion.button>

            <motion.button
              type="submit"
              className={`bg-primary text-button-text p-2 rounded-lg transition-colors ${
                (!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || isDisabled)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary/90'
              }`}
              whileHover={(!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || isDisabled) ? {} : { scale: 1.05 }}
              whileTap={(!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || isDisabled) ? {} : { scale: 0.95 }}
              disabled={!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || isDisabled}
            >
              {isLoading && !isSearchMode ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </form>

      <AnimatePresence>
        {(isVoiceToTextMode || isVoiceToVoiceMode) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} />
          </motion.div>
        )}

        {speechRecognitionError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 text-destructive text-sm"
          >
            {speechRecognitionError}
          </motion.div>
        )}

        {filePaths.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <div className="flex flex-wrap gap-2">
              {filePaths.map((path, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                >
                  <span className="truncate max-w-[200px]">
                    {path.split('/').pop()}
                  </span>
                  <button
                    onClick={() => setFilePaths(paths => paths.filter((_, i) => i !== index))}
                    className="p-1 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showContextEditor && (
        <ContextEditor
          initialContext={editingContext}
          onClose={() => {
            setShowContextEditor(false);
            setEditingContext(undefined);
          }}
        />
      )}

      <PromptLibrary
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
      />
    </div>
  );
}