import React, { useEffect, useRef, useState } from 'react';
import { elevenlabs } from '../../lib/elevenlabs';
import { useToastStore } from '../../store/toastStore';
import { Voice } from '../../lib/elevenlabs';
import { useVoiceStore } from '../../store/voiceStore';

interface MessageAudioPlayerProps {
  messageId: string;
  content: string;
  onPlayingChange: (isPlaying: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function MessageAudioPlayer({ messageId, content, onPlayingChange, onLoadingChange }: MessageAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToastStore();
  const { voices, selectedVoiceId } = useVoiceStore();
  
  // Get the selected voice from the voices array
  const selectedVoice = voices.find(voice => voice.id === selectedVoiceId);
  
  // Early return if no voice is selected
  if (!selectedVoice) {
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    let mediaSource: MediaSource | null = null;
    let sourceBuffer: SourceBuffer | null = null;
    let audioQueue: Uint8Array[] = [];
    let isAppending = false;
    let abortController = new AbortController();

    const appendNextChunk = () => {
      if (!isAppending && audioQueue.length > 0 && sourceBuffer && !sourceBuffer.updating) {
        isAppending = true;
        const chunk = audioQueue.shift();
        if (chunk) {
          try {
            sourceBuffer.appendBuffer(chunk);
          } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              // Clear buffer and retry
              if (sourceBuffer.buffered.length > 0) {
                sourceBuffer.remove(0, sourceBuffer.buffered.end(0));
              }
              audioQueue.unshift(chunk);
            }
          }
        }
      }
    };

    const startPlayback = async () => {
      try {
        setIsLoading(true);
        onLoadingChange?.(true);
        setError(null);
        
        const stream = await elevenlabs.textToSpeech({
          text: content,
          voice_id: selectedVoice.id,
          stream: true,
          output_format: 'mp3_44100_128'
        });

        if (stream instanceof ReadableStream) {
          mediaSource = new MediaSource();
          if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSource);
          }

          mediaSource.addEventListener('sourceopen', () => {
            if (mediaSource) {
              sourceBuffer = mediaSource?.addSourceBuffer('audio/mpeg');
              if (sourceBuffer) {
                sourceBuffer.addEventListener('updateend', () => {
                  isAppending = false;
                  appendNextChunk();
                });
              }
            } else {
              const errorMessage = 'Failed to initialize audio';
              showToast({
                message: errorMessage,
                type: 'error'
              });
            }

            // Handle the incoming stream
            const reader = stream.getReader();
            const readChunk = async () => {
              try {
                const { done, value } = await reader.read();
                if (done) {
                  mediaSource?.endOfStream();
                  return;
                }

                if (value) {
                  audioQueue.push(value);
                  appendNextChunk();
                }
                readChunk();
              } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                  showToast({
                    message: 'Error streaming audio',
                    type: 'error'
                  });
                }
              }
            };

            readChunk().catch(console.error);
          });

          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              showToast({
                message: 'Failed to start audio playback',
                type: 'error'
              });
            });
          }
        }

        setIsLoading(false);
        onLoadingChange?.(false);
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
          setError(errorMessage);
          showToast({
            message: errorMessage,
            type: 'error'
          });
          setIsLoading(false);
          onLoadingChange?.(false);
        }
      }
    };

    if (content && selectedVoice) {
      startPlayback();
    }

    return () => {
      isMounted = false;
      abortController.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (mediaSource && mediaSource.readyState === 'open') {
        mediaSource.endOfStream();
      }
      audioQueue = [];
      isAppending = false;
      elevenlabs.stopStream(messageId);
    };
  }, [messageId, content, selectedVoice]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handlePlay = () => onPlayingChange(true);
      const handlePause = () => onPlayingChange(false);
      const handleEnded = () => onPlayingChange(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [onPlayingChange]);

  if (error) {
    console.error('Audio playback error:', error);
    showToast({
      message: error,
      type: 'error',
      duration: 5000
    });
    return null; // Or return an error UI component
  }

  return (
    <audio
      ref={audioRef}
      className="hidden"
      controls={false}
      onError={(e) => {
        console.error('Audio error:', e);
        const errorMessage = 'Failed to play audio';
        setError(errorMessage);
        showToast({
          message: errorMessage,
          type: 'error'
        });
      }}
    />
  );
}