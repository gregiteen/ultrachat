import React from "react";
import { useAudioStore } from "../../store/audioStore";

interface GlobalAudioPlayerProps {
  onLibraryOpen: () => void;
}

export function GlobalAudioPlayer({ onLibraryOpen }: GlobalAudioPlayerProps) {
  const { currentTrack, isPlaying, togglePlayback, nextTrack, previousTrack } = useAudioStore();

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Track info */}
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.artwork}
            alt={currentTrack.title}
            className="h-12 w-12 rounded-md"
          />
          <div>
            <div className="font-medium">{currentTrack.title}</div>
            <div className="text-sm text-muted-foreground">{currentTrack.artist}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={previousTrack}
            className="p-2 hover:bg-accent rounded-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"
              />
            </svg>
          </button>
          <button
            onClick={togglePlayback}
            className="p-2 hover:bg-accent rounded-md"
          >
            {isPlaying ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M8 5v14l11-7z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 hover:bg-accent rounded-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"
              />
            </svg>
          </button>
        </div>

        {/* Library button */}
        <button
          onClick={onLibraryOpen}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Library
        </button>
      </div>
    </div>
  );
}