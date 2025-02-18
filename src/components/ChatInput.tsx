import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Edit, Paperclip, Image, Command, Search, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContextStore } from '../store/context';
import type { Context } from '../types';
import { VoiceRecorder } from './VoiceRecorder';
import { speechRecognition } from '../lib/speech';
import { supabase } from '../lib/supabase';
import { Spinner } from '../design-system/components/feedback/Spinner';
import ContextEditor from './ContextEditor';
import { PromptLibrary } from './PromptLibrary';
import { useAudioStore } from '../store/audioStore';
import { usePromptStore } from '../store/promptStore';

interface ChatInputProps {
  onSendMessage: (content: string, files?: string[], contextId?: string, isSystemMessage?: boolean, skipAiResponse?: boolean, forceSearch?: boolean) => Promise<void>;
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
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | undefined>(undefined);
  const [transcribedText, setTranscribedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const { isVoicePlaying, playTextToSpeech } = useAudioStore();
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const { savePrompt } = usePromptStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const paths = await Promise.all(
        files.map(async (file) => {
          const filePath = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(filePath, file);
          if (uploadError) {
            console.error('Upload error:', uploadError);
            setSpeechRecognitionError(`Failed to upload ${file.name}: ${uploadError.message}`);
            return null;
          }
          return filePath;
        })
      );
      const successfulUploads = paths.filter((path): path is string => path !== null);
      setFilePaths(prev => [...prev, ...successfulUploads]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled) return;

    const currentMessage = message;
    setMessage('');
    setTranscribedText('');
    
    try {
      await onSendMessage(currentMessage, filePaths, activeContext?.id, false, false, isSearchMode);
      setFilePaths([]);
    } catch (error) {
      setMessage(currentMessage);
      console.error('Failed to send message:', error);
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

      await onSendMessage(text, [], activeContext?.id, false, false, isSearchMode);
      setTranscribedText('');
    } catch (error) {
      console.error('Error processing voice:', error);
      setSpeechRecognitionError('Error processing voice');
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
    }
  };

  return (
    <div className="border-t border-muted bg-background">
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
                >
                  {context.name}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContext(context);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1"
                    whileHover={{ scale: 1.1 }}
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
                className="rounded-full px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                + New Assistant
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-4">
        <motion.div
          className="relative flex items-end gap-2 rounded-xl border border-muted bg-input-background p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all"
        >
          <motion.button
            type="button"
            onClick={() => setShowContextMenu(!showContextMenu)}
            className={`flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${
              showContextMenu ? 'bg-primary/10 text-primary' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*"
            capture="environment"
          />

          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={transcribedText || (isSearchMode ? "Ask a question..." : "Type a message...")}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-1 px-2 resize-none overflow-hidden"
              style={{
                minHeight: '24px',
                maxHeight: '200px',
              }}
              disabled={isVoiceToVoiceMode || disabled}
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
              className={`text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={disabled}
              whileHover={disabled ? {} : { scale: 1.05 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
            >
              <Paperclip className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={disabled}
              whileHover={disabled ? {} : { scale: 1.05 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
            >
              <Image className="h-5 w-5" />
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
              } ${(isRecording || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={(isRecording || disabled) ? {} : { scale: 1.05 }}
              whileTap={(isRecording || disabled) ? {} : { scale: 0.95 }}
              disabled={isRecording || disabled}
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
              } ${(!activeContext?.voice?.id || isRecording || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={(!activeContext?.voice?.id || isRecording || disabled) ? {} : { scale: 1.05 }}
              whileTap={(!activeContext?.voice?.id || isRecording || disabled) ? {} : { scale: 0.95 }}
              disabled={!activeContext?.voice?.id || isRecording || disabled}
            >
              <Volume2 className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setShowPromptLibrary(true)}
              className={`transition-colors p-2 rounded-lg ${
                showPromptLibrary
                  ? 'text-primary bg-primary/10'
                  : 'text-icon-color hover:text-icon-hover hover:bg-muted/10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Prompt Library"
              disabled={disabled}
              whileHover={disabled ? {} : { scale: 1.05 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
            >
              <HelpCircle className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setIsSearchMode?.(!isSearchMode)}
              aria-label={isSearchMode ? 'Search mode enabled' : 'Search mode disabled'}
              className={`transition-all p-2 rounded-lg ${
                isSearchMode
                  ? 'text-green-500 bg-green-500/20 scale-110'
                  : 'text-icon-color hover:text-icon-hover hover:bg-muted/10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={disabled ? {} : { scale: 1.05 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
              disabled={disabled}
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
                (!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || disabled)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary/90'
              }`}
              whileHover={(!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || disabled) ? {} : { scale: 1.05 }}
              whileTap={(!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || disabled) ? {} : { scale: 0.95 }}
              disabled={!message.trim() || isLoading || isVoicePlaying || isVoiceToVoiceMode || disabled}
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
            className="px-4 pb-4 text-red-500 text-sm"
          >
            {speechRecognitionError}
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