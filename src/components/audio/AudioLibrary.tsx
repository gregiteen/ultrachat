import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Youtube, Search, Plus, X, PlayCircle, Heart, Clock, Filter } from 'lucide-react';
import { useContextStore } from '../../store/context';
import type { Track, Playlist } from '../../types/audio';

interface AudioLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect: (track: Track) => void;
  currentTrack?: Track;
}

export function AudioLibrary({ isOpen, onClose, onTrackSelect, currentTrack }: AudioLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'youtube'>('library');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist'>('date');
  const [filterSource, setFilterSource] = useState<'all' | 'local' | 'youtube'>('all');
  const { activeContext } = useContextStore();

  useEffect(() => {
    // Load tracks and playlists from storage/API
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    // TODO: Load from storage/API
    const mockTracks: Track[] = [
      {
        id: '1',
        title: 'Sample Track 1',
        artist: 'Artist 1',
        duration: 180,
        source: 'local',
        url: '/sample1.mp3',
        addedAt: new Date(),
        isFavorite: true
      },
      // Add more mock tracks
    ];
    setTracks(mockTracks);
  };

  const searchYouTubeMusic = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // TODO: Integrate with YouTube Music API
      const results: Track[] = [
        {
          id: 'yt1',
          title: 'YouTube Result 1',
          artist: 'YouTube Artist 1',
          duration: 240,
          source: 'youtube',
          url: 'https://youtube.com/watch?v=123',
          addedAt: new Date()
        },
        // Add more mock results
      ];
      setYoutubeResults(results);
    } catch (error) {
      console.error('Error searching YouTube Music:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'youtube') {
      searchYouTubeMusic(searchQuery);
    }
  };

  const toggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, isFavorite: !track.isFavorite } : track
    ));
  };

  const addToLibrary = (track: Track) => {
    setTracks(prev => [...prev, { ...track, addedAt: new Date() }]);
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: new Date()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const addToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const track = tracks.find(t => t.id === trackId);
        if (track && !playlist.tracks.some(t => t.id === trackId)) {
          return { ...playlist, tracks: [...playlist.tracks, track] };
        }
      }
      return playlist;
    }));
  };

  const filteredTracks = tracks
    .filter(track => {
      if (filterSource !== 'all' && track.source !== filterSource) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        default:
          return (b.addedAt?.getTime() ?? 0) - (a.addedAt?.getTime() ?? 0);
      }
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-background rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden shadow-xl">
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 border-r border-muted p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Audio Library</h2>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`flex-1 p-2 rounded ${
                      activeTab === 'library'
                        ? 'bg-primary text-button-text'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Music2 className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab('youtube')}
                    className={`flex-1 p-2 rounded ${
                      activeTab === 'youtube'
                        ? 'bg-primary text-button-text'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Youtube className="h-4 w-4 mx-auto" />
                  </button>
                </div>

                {/* Playlists */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Playlists</h3>
                    <button
                      onClick={() => createPlaylist('New Playlist')}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {playlists.map(playlist => (
                    <button
                      key={playlist.id}
                      className="w-full text-left px-2 py-1 rounded hover:bg-muted text-sm truncate"
                    >
                      {playlist.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-muted">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'youtube' ? 'Search YouTube Music...' : 'Search library...'}
                        className="w-full pl-9 pr-4 py-2 rounded-md border border-muted bg-input-background"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 rounded-md border border-muted bg-input-background"
                      >
                        <option value="date">Date Added</option>
                        <option value="title">Title</option>
                        <option value="artist">Artist</option>
                      </select>
                      <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value as any)}
                        className="px-3 py-2 rounded-md border border-muted bg-input-background"
                      >
                        <option value="all">All Sources</option>
                        <option value="local">Local</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>
                  </form>
                </div>

                {/* Track List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'library' ? (
                    <div className="space-y-2">
                      {filteredTracks.map(track => (
                        <div
                          key={track.id}
                          className={`flex items-center gap-4 p-2 rounded hover:bg-muted cursor-pointer ${
                            currentTrack?.id === track.id ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => onTrackSelect(track)}
                        >
                          {track.artwork ? (
                            <img
                              src={track.artwork}
                              alt={track.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Music2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{track.title}</div>
                            <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(track.id);
                              }}
                              className={`p-1 rounded hover:bg-muted ${
                                track.isFavorite ? 'text-red-500' : ''
                              }`}
                            >
                              <Heart className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isSearching ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        youtubeResults.map(track => (
                          <div
                            key={track.id}
                            className="flex items-center gap-4 p-2 rounded hover:bg-muted"
                          >
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Youtube className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{track.title}</div>
                              <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                            </div>
                            <button
                              onClick={() => addToLibrary(track)}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}