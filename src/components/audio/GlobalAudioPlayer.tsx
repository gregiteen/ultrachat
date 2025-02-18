import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, Music2, Youtube, Mic } from 'lucide-react';
import { useAudioStore } from '../../store/audioStore';
import type { Track } from '../../types/audio';

interface GlobalAudioPlayerProps {
  onLibraryOpen: () => void;
}

export function GlobalAudioPlayer({ onLibraryOpen }: GlobalAudioPlayerProps) {
  const { 
    currentTrack, 
    currentVoice, 
    queue, 
    voiceQueue, 
    isPlaying, 
    isVoicePlaying,
    setIsPlaying,
    setIsVoicePlaying,
    removeFromQueue, 
    removeFromVoiceQueue, 
    clearQueue, 
    musicVolume, 
    voiceVolume,
    setVolumes,
    isMuted,
    setMuted
  } = useAudioStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number>();
  const isTransitioning = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearQueue(); // This will clean up all blob URLs
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [clearQueue]);

  // Handle volume changes
  useEffect(() => {
    try {
      if (musicAudioRef.current) {
        musicAudioRef.current.volume = isMuted ? 0 : musicVolume;
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.volume = isMuted ? 0 : voiceVolume;
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [musicVolume, voiceVolume, isMuted]);

  // Handle audio loading and metadata
  useEffect(() => {
    if (musicAudioRef.current && currentTrack) {
      const audio = musicAudioRef.current;

      const handleMetadata = () => {
        setProgress(0);
      };

      const handleEnded = () => {
        if (!isTransitioning.current) {
          handleNext();
        }
      };

      const handleError = (e: ErrorEvent) => {
        console.error('Music playback error:', e);
        setIsPlaying(false);
      };

      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentTrack, setIsPlaying]);

  // Handle voice audio
  useEffect(() => {
    if (voiceAudioRef.current && currentVoice) {
      const audio = voiceAudioRef.current;

      const handleMetadata = () => {
        setProgress(0);
      };

      const handleEnded = () => {
        if (!isTransitioning.current) {
          isTransitioning.current = true;
          setIsVoicePlaying(false);
          if (currentVoice) {
            removeFromVoiceQueue(currentVoice.id);
          }
          isTransitioning.current = false;
        }
      };

      const handleError = (e: ErrorEvent) => {
        console.error('Voice playback error:', e);
        setIsVoicePlaying(false);
      };

      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentVoice, setIsVoicePlaying, removeFromVoiceQueue]);

  const updateProgress = () => {
    if (musicAudioRef.current && !isDragging) {
      const audio = musicAudioRef.current;
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    }
  };

  const handlePlay = async () => {
    if (musicAudioRef.current && !isTransitioning.current) {
      isTransitioning.current = true;
      try {
        if (isPlaying) {
          musicAudioRef.current.pause();
        } else {
          await musicAudioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Playback error:', error);
        setIsPlaying(false);
      } finally {
        isTransitioning.current = false;
      }
    }
  };

  const handleNext = () => {
    if (isTransitioning.current) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < queue.length - 1) {
      isTransitioning.current = true;
      try {
        removeFromQueue(currentTrack!.id);
      } finally {
        isTransitioning.current = false;
      }
    }
  };

  const handlePrev = () => {
    if (isTransitioning.current) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      isTransitioning.current = true;
      try {
        for (let i = currentIndex; i >= currentIndex - 1; i--) {
          if (queue[i]) {
            removeFromQueue(queue[i].id);
          }
        }
      } finally {
        isTransitioning.current = false;
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) return;

    const normalizedValue = Math.max(0, Math.min(1, value));
    setProgress(normalizedValue);

    if (musicAudioRef.current?.duration) {
      try {
        musicAudioRef.current.currentTime = normalizedValue * musicAudioRef.current.duration;
      } catch (error) {
        console.error('Error setting playback position:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack && !currentVoice) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        height: isExpanded ? '20rem' : '4rem',
        width: isExpanded ? '24rem' : '16rem'
      }}
      className="fixed bottom-4 right-4 bg-background border border-muted rounded-lg shadow-lg overflow-hidden z-50"
    >
      {/* Audio Elements */}
      <audio
        ref={musicAudioRef}
        src={currentTrack?.url}
        onTimeUpdate={updateProgress}
      />
      <audio
        ref={voiceAudioRef}
        src={currentVoice?.url}
      />

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Artwork */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              {currentTrack?.artwork ? (
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <Music2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {/* Source indicator */}
              {currentTrack?.source === 'youtube' ? (
                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
                  <Youtube className="h-4 w-4" />
                </div>
              ) : currentTrack?.source === 'tts' ? (
                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded">
                  <Mic className="h-4 w-4" />
                </div>
              ) : null}
            </div>

            {/* Track Info */}
            <div className="text-center mb-4">
              <h3 className="font-semibold truncate">{currentTrack?.title || currentVoice?.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentTrack?.artist || currentVoice?.artist}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Progress */}
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={handleProgressChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(progress * (musicAudioRef.current?.duration || 0))}</span>
              <span>{formatTime(musicAudioRef.current?.duration || 0)}</span>
            </div>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Music2 className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : musicVolume}
                  onChange={(e) => setVolumes(parseFloat(e.target.value), voiceVolume)}
                  className="w-16"
                />
              </div>
              <div className="flex items-center gap-1">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : voiceVolume}
                  onChange={(e) => setVolumes(musicVolume, parseFloat(e.target.value))}
                  className="w-16"
                />
              </div>
            </div>
            <button
              onClick={() => setMuted(!isMuted)}
              className="p-1 hover:bg-muted rounded"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-muted rounded disabled:opacity-50"
              disabled={queue.findIndex(t => t.id === currentTrack?.id) === 0 || isTransitioning.current}
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={handlePlay}
              className="p-2 bg-primary text-button-text rounded-full hover:bg-secondary transition-colors disabled:opacity-50"
              disabled={isVoicePlaying || isTransitioning.current}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-muted rounded disabled:opacity-50"
              disabled={queue.findIndex(t => t.id === currentTrack?.id) === queue.length - 1 || isTransitioning.current}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Expand/Library */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onLibraryOpen}
              className="p-1 hover:bg-muted rounded"
            >
              <Music2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}