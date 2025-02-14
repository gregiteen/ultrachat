import React, { useState, useRef } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // in seconds
}

export function VoiceRecorder({ 
  onRecordingComplete,
  maxDuration = 60 // default 1 minute
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        chunks.current = [];
        setDuration(0);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setError(null);

      // Start duration timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setDuration(seconds);
        if (seconds >= maxDuration) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      setError('Could not access microphone');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
            <span className="text-sm text-gray-600">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 text-red-500 hover:text-red-600"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}