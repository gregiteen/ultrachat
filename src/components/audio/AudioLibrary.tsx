import React from "react";
import { useAudioStore, Track } from "../../store/audioStore";

interface AudioLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect?: (track: Track) => void;
}

export function AudioLibrary({ isOpen, onClose, onTrackSelect }: AudioLibraryProps) {
  const { queue, addToQueue, removeFromQueue, setCurrentTrack } = useAudioStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Audio Library</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {queue.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-4 bg-accent rounded-md"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={track.artwork}
                  alt={track.title}
                  className="h-12 w-12 rounded-md"
                />
                <div>
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {track.artist}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentTrack(track);
                    if (onTrackSelect) onTrackSelect(track);
                  }}
                  className="p-2 hover:bg-background rounded-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M8 5v14l11-7z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => removeFromQueue(track.id)}
                  className="p-2 hover:bg-background rounded-md text-destructive"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}