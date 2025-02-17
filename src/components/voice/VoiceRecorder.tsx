import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, RefreshCw, Pause, Play } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (recording: Blob) => void;
  minDuration?: number;
  maxDuration?: number;
}

export function VoiceRecorder({ 
  onRecordingComplete,
  minDuration = 3,
  maxDuration = 30
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const audioContext = useRef<AudioContext | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Cleanup audio URL when it changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorder.current) {
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    audioChunks.current = [];
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      audioContext.current = new AudioContext();
      analyserNode.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyserNode.current);
      
      // Configure analyser
      analyserNode.current.fftSize = 256;
      const bufferLength = analyserNode.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Start volume monitoring
      const checkVolume = () => {
        if (!analyserNode.current || !isRecording) return;
        
        analyserNode.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setVolume(average / 128); // Normalize to 0-1

        if (isRecording) {
          requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    } catch (err) {
      console.error('Error setting up audio analyser:', err);
    }
  };

  const startRecording = async () => {
    try {
      cleanup();
      setIsRetrying(false);
      setError(null);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setupAudioAnalyser(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
      };

      mediaRecorder.current.onpause = () => {
        setIsPaused(true);
      };

      mediaRecorder.current.onresume = () => {
        setIsPaused(false);
      };

      mediaRecorder.current.onerror = (event) => {
        setError('Recording error occurred. Please try again.');
        cleanup();
        setIsRetrying(true);
      };

      mediaRecorder.current.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      setError('Failed to access microphone. Please ensure you have granted permission.');
      setIsRetrying(true);
      console.error('Recording error:', err);
    }
  };

  const togglePause = () => {
    if (!mediaRecorder.current || !isRecording) return;

    if (isPaused) {
      mediaRecorder.current.resume();
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorder.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      if (duration < minDuration) {
        setError(`Recording must be at least ${minDuration} seconds long`);
        return;
      }

      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:bg-secondary'
            } text-button-text transition-colors`}
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {isRecording && (
            <button
              onClick={togglePause}
              className="p-3 rounded-full bg-primary hover:bg-secondary text-button-text transition-colors"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
          )}

          {isRetrying && (
            <button
              onClick={startRecording}
              className="p-3 rounded-full bg-primary hover:bg-secondary text-button-text transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className={`h-4 w-4 ${isRecording ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
          <div className="text-lg font-mono">
            {formatTime(duration)}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full" />
          <button
            onClick={() => {
              setAudioUrl(null);
              audioChunks.current = [];
              setDuration(0);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear Recording
          </button>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        {`Recording must be between ${minDuration} and ${maxDuration} seconds`}
      </div>
    </div>
  );
}