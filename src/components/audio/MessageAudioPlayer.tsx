import React, { useEffect, useRef, useState } from 'react';
import { elevenlabs } from '../../lib/elevenlabs';

interface MessageAudioPlayerProps {
  messageId: string;
  content: string;
  onPlayingChange: (isPlaying: boolean) => void;
}

export function MessageAudioPlayer({ messageId, content, onPlayingChange }: MessageAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let mediaSource: MediaSource | null = null;
    let sourceBuffer: SourceBuffer | null = null;
    let audioQueue: Uint8Array[] = [];
    let isAppending = false;

    const appendNextChunk = () => {
      if (!isAppending && audioQueue.length > 0 && sourceBuffer && !sourceBuffer.updating) {
        isAppending = true;
        const chunk = audioQueue.shift();
        if (chunk) {
          sourceBuffer.appendBuffer(chunk);
        }
      }
    };

    const startPlayback = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const stream = await elevenlabs.textToSpeech({
          text: content,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Default voice
          stream: true,
          output_format: 'mp3_44100_128'
        });

        if (stream instanceof ReadableStream) {
          mediaSource = new MediaSource();
          if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(mediaSource);
          }

          mediaSource.addEventListener('sourceopen', () => {
            sourceBuffer = mediaSource?.addSourceBuffer('audio/mpeg');
            if (sourceBuffer) {
              sourceBuffer.addEventListener('updateend', () => {
                isAppending = false;
                appendNextChunk();
              });
            }

            // Handle the incoming stream
            const reader = stream.getReader();
            const readChunk = async () => {
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
            };

            readChunk().catch(console.error);
          });

          if (audioRef.current) {
            audioRef.current.play();
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to play audio');
          setIsLoading(false);
        }
      }
    };

    startPlayback();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (mediaSource && mediaSource.readyState === 'open') {
        mediaSource.endOfStream();
      }
      elevenlabs.stopStream(messageId);
    };
  }, [messageId, content]);

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
    return null;
  }

  return (
    <audio
      ref={audioRef}
      className="hidden"
      controls={false}
      onError={(e) => {
        console.error('Audio error:', e);
        setError('Failed to play audio');
      }}
    />
  );
}