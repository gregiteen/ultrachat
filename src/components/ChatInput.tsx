import React, { useState, useRef } from 'react';
import { Send, Mic, Volume2, Edit, Paperclip, Image } from 'lucide-react';
import { useContextStore } from '../store/context';
import ContextEditor from './ContextEditor';
import { VoiceRecorder } from './VoiceRecorder';
import type { Context } from '../types';
import { elevenlabs } from '../lib/elevenlabs';
import { speechRecognition } from '../lib/speech';
import { FileUploader } from './FileUploader';
import { supabase } from '../lib/supabase';

interface ChatInputProps {
  onSendMessage: (content: string, files?: string[]) => Promise<void>;
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

    await onSendMessage(message, filePaths);
    setMessage('');
    setTranscribedText(''); // Clear transcribed text on submit
    setFilePaths([]); // Clear file paths
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  const handleVoiceRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    try {
      let text = transcribedText;

      if (!text) {
        // Start speech recognition
        await speechRecognition.startRecording((result, isFinal) => {
          if (isFinal) {
            text = result;
            setTranscribedText(result);
            speechRecognition.stopRecording();
          } else {
            setTranscribedText(result);
          }
        });
      }

      if (!text) {
        // No text was transcribed
        return;
      }

      if (isVoiceToVoiceMode && activeContext?.voice?.id) {
        // Convert text to speech using ElevenLabs
        setIsAudioPlaying(true); // Set audio playing state
        const audioBlob = await elevenlabs.textToSpeech({
          text,
          voice_id: activeContext.voice.id,
          voice_settings: activeContext.voice.settings
        });

        // Create audio element and play
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsAudioPlaying(false); // Reset on audio end
        audio.play();
      }

      // Send the transcribed text
      setTranscribedText('');
      await onSendMessage(text);
    } catch (error) {
      console.error('Error processing voice recording:', error);
      setSpeechRecognitionError('Error processing voice recording');
    }
  };


  return (
    <div className="border-t border-muted bg-background">
      {/* Context Selector */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {contexts.map((context) => (
          <button
            key={context.id}
            onClick={() => setActiveContext(context)}
            className={`group relative rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeContext?.id === context.id
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted-foreground/10'
            }`}
          >
            {context.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditContext(context);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1"
            >
              <Edit className="h-3 w-3" />
            </button>
          </button>
        ))}
        <button
          onClick={() => {
            setEditingContext(undefined);
            setShowContextEditor(true);
          }}
          className="rounded-full px-3 py-1 text-sm font-medium bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          + New Context
        </button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors"
        >
          <Paperclip className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors"
        >
          <Image className="h-6 w-6" />
        </button>
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={transcribedText || "Type a message..."}
            className="w-full rounded-lg border border-muted bg-input-background text-foreground placeholder:text-muted-foreground px-4 py-2 pr-12 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={1}
            style={{
              resize: 'none',
              minHeight: '44px',
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
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
                if (setIsVoiceToTextMode) {
                    setIsVoiceToTextMode(!isVoiceToTextMode);
                    if (!isVoiceToTextMode) {
                        setIsRecording(true);
                        setSpeechRecognitionError(null);
                        speechRecognition.startRecording((result, isFinal) => {
                            if (isFinal) {
                                setTranscribedText(result);
                                setIsRecording(false);
                                speechRecognition.stopRecording();
                            } else {
                                setTranscribedText(result);
                            }
                        }).catch((error) => {
                            console.error("Error starting speech recognition:", error);
                            setSpeechRecognitionError("Error starting speech recognition");
                            setIsVoiceToTextMode(false);
                            setIsRecording(false);
                        });
                    } else {
                        speechRecognition.stopRecording().catch((error) => {
                            console.error("Error stopping speech recognition:", error);
                            setSpeechRecognitionError("Error stopping speech recognition");
                        });
                        setIsRecording(false);
                        setTranscribedText('');
                    }
                }
            }}
            className={`flex-shrink-0 transition-colors ${
              isVoiceToTextMode
                ? 'text-primary'
                : 'text-icon-color hover:text-icon-hover'
            }`}
            title="Voice to Text Mode"
            disabled={isRecording}
          >
            <Mic className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceToVoiceMode && setIsVoiceToVoiceMode(!isVoiceToVoiceMode)}
            className={`flex-shrink-0 transition-colors ${
              isVoiceToVoiceMode
                ? 'text-primary'
                : 'text-icon-color hover:text-icon-hover'
            }`}
            title="Voice to Voice Mode"
            disabled={!activeContext?.voice?.id || isRecording}
          >
            <Volume2 className="h-6 w-6" />
          </button>
        </div>

        {isVoiceToTextMode && !isVoiceToVoiceMode && (
          <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} />
        )}
        {speechRecognitionError && (
          <div className="text-red-500 text-sm">{speechRecognitionError}</div>
        )}

        <button
          type="submit"
          className="flex-shrink-0 rounded-full bg-primary p-2 text-button-text hover:bg-secondary disabled:opacity-50 transition-colors"
          disabled={!message.trim() || isLoading || isAudioPlaying || isVoiceToVoiceMode}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Context Editor Modal */}
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