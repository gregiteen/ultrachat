import React, { useState, useRef } from 'react';
import { Send, Mic, Volume2, Edit, Paperclip, Image, Command, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContextStore } from '../store/context';
import ContextEditor from './ContextEditor';
import { VoiceRecorder } from './VoiceRecorder';
import type { Context } from '../types';
import { elevenlabs } from '../lib/elevenlabs';
import { speechRecognition } from '../lib/speech';
import { supabase } from '../lib/supabase';

interface ChatInputProps {
  onSendMessage: (content: string, files?: string[], contextId?: string, isSystemMessage?: boolean, skipAiResponse?: boolean, forceSearch?: boolean) => Promise<void>;
  isLoading?: boolean;
  isVoiceToTextMode?: boolean;
  setIsVoiceToTextMode?: (value: boolean) => void;
  isVoiceToVoiceMode?: boolean;
  setIsVoiceToVoiceMode?: (value: boolean) => void;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  isVoiceToTextMode = false,
  setIsVoiceToTextMode,
  isVoiceToVoiceMode = false,
  setIsVoiceToVoiceMode,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | undefined>(undefined);
  const [transcribedText, setTranscribedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchModeEnabled, setSearchModeEnabled] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    if (!message.trim() || isLoading) return;

    await onSendMessage(message, filePaths, undefined, false, false, searchModeEnabled);
    setMessage('');
    setTranscribedText('');
    setFilePaths([]);
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  const processVoiceRecording = async (text: string) => {
    try {
      if (isVoiceToVoiceMode && activeContext?.voice?.id) {
        setIsAudioPlaying(true);
        const audioBlob = await elevenlabs.textToSpeech({
          text,
          voice_id: activeContext.voice.id,
          voice_settings: activeContext.voice.settings
        });

        const audioUrl = URL.createObjectURL(audioBlob as Blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsAudioPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play();
      }

      await onSendMessage(text, [], undefined, false, false, searchModeEnabled);
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
            className="px-4 py-2 flex flex-wrap gap-2 overflow-hidden"
          >
            {contexts.map((context) => (
              <motion.button
                key={context.id}
                onClick={() => setActiveContext(context)}
                className={`group relative rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  activeContext?.id === context.id
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted-foreground/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {context.name}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditContext(context);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1"
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
              className="rounded-full px-3 py-1 text-sm font-medium bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + New Context
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-4">
        <motion.div
          className="relative flex items-center gap-2 rounded-xl border border-muted bg-input-background p-2"
          whileFocus={{ borderColor: 'hsl(var(--primary))' }}
        >
          <motion.button
            type="button"
            onClick={() => setShowContextMenu(!showContextMenu)}
            className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg"
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

          <motion.div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={transcribedText || "Type a message..."}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              rows={1}
              style={{
                resize: 'none',
                minHeight: '24px',
                maxHeight: '200px',
              }}
              disabled={isVoiceToVoiceMode}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </motion.div>

          <div className="flex gap-1">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Paperclip className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="text-icon-color hover:text-icon-hover transition-colors p-2 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                  ? 'text-primary'
                  : 'text-icon-color hover:text-icon-hover'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRecording}
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
                  ? 'text-primary'
                  : 'text-icon-color hover:text-icon-hover'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!activeContext?.voice?.id || isRecording}
            >
              <Volume2 className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setSearchModeEnabled(!searchModeEnabled)}
              aria-label={searchModeEnabled ? 'Search mode enabled' : 'Search mode disabled'}
              className={`transition-all p-2 rounded-lg ${
                searchModeEnabled
                  ? 'text-green-500 bg-green-500/10 scale-110'
                  : 'text-icon-color hover:text-icon-hover hover:bg-muted/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="submit"
              className="bg-primary text-button-text p-2 rounded-lg disabled:opacity-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!message.trim() || isLoading || isAudioPlaying || isVoiceToVoiceMode}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </form>

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

      {showContextEditor && (
        <ContextEditor
          initialContext={editingContext}
          onClose={() => {
            setShowContextEditor(false);
            setEditingContext(undefined);
          }}
        />
      )}
    </div>
  );
}