import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, Music2, Youtube } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  source: 'local' | 'youtube';
  url: string;
  isPlaying?: boolean;
}

interface GlobalAudioPlayerProps {
  onLibraryOpen: () => void;
}

export function GlobalAudioPlayer({ onLibraryOpen }: GlobalAudioPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number>();

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const updateProgress = () => {
    if (audioRef.current && !isDragging) {
      setProgress(audioRef.current.currentTime / audioRef.current.duration);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value * audioRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        height: isExpanded ? '20rem' : '4rem',
        width: isExpanded ? '24rem' : '16rem'
      }}
      className="fixed bottom-4 right-4 bg-background border border-muted rounded-lg shadow-lg overflow-hidden z-50"
    >
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={updateProgress}
        onEnded={handleNext}
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
              {currentTrack.artwork ? (
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
              {currentTrack.source === 'youtube' && (
                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
                  <Youtube className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center mb-4">
              <h3 className="font-semibold truncate">{currentTrack.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
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
              <span>{formatTime(progress * (currentTrack.duration || 0))}</span>
              <span>{formatTime(currentTrack.duration || 0)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-muted rounded"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16"
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-muted rounded"
              disabled={queue.findIndex(t => t.id === currentTrack.id) === 0}
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={handlePlay}
              className="p-2 bg-primary text-button-text rounded-full hover:bg-secondary transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-muted rounded"
              disabled={queue.findIndex(t => t.id === currentTrack.id) === queue.length - 1}
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