export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  source: 'local' | 'youtube' | 'tts';
  url: string;
  isPlaying?: boolean;
  addedAt?: Date;
  isFavorite?: boolean;
  videoId?: string; // For YouTube tracks
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date;
}