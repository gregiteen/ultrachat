import React, { useState, useEffect } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';
import { speechRecognition } from '../lib/speech';

interface VoiceRecorderProps {
  onStart?: () => void;
  onStop?: () => void;
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number; // in seconds
  children?: React.ReactNode;
  className?: string;
}

export function VoiceRecorder({ 
  onRecordingComplete, onStart, onStop,
  children,
  className = '',
  maxDuration = 60 // default 1 minute
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  
  useEffect(() => {
    let timer: number;
    if (isRecording) {
      timer = window.setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      onStart?.();
      setError(null);
      setDuration(0);
      setTranscribedText('');

      await speechRecognition.startRecording((text, isFinal) => {
        setTranscribedText(text);
        if (isFinal) {
          const blob = new Blob([text], { type: 'text/plain' });
          onRecordingComplete?.(blob);
          stopRecording();
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access microphone');
      console.error('Error starting recording:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      speechRecognition.stopRecording();
      setIsRecording(false);
      onStop?.();
      if (transcribedText) {
        const blob = new Blob([transcribedText], { type: 'text/plain' });
        onRecordingComplete?.(blob);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-4">
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
        
        {isRecording ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">
                {formatDuration(duration)} / {formatDuration(maxDuration)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="p-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <Square className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {children || <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>

      {transcribedText && (
        <div className="text-sm text-muted-foreground bg-muted/10 p-2 rounded-md">
          {transcribedText}
        </div>
      )}
    </div>
  );
}