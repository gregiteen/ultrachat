import React, { useState, useEffect } from 'react';
import { elevenlabs, type Voice, type HistoryItem } from '../../lib/elevenlabs';
import { VoiceDesigner } from './VoiceDesigner';

export function VoiceLibrary() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [previewText, setPreviewText] = useState('Hello! This is a preview of my voice.');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioElements] = useState(new Map<string, HTMLAudioElement>());

  useEffect(() => {
    loadVoices();
    loadHistory();
  }, []);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const fetchedVoices = await elevenlabs.getVoices();
      setVoices(fetchedVoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const historyItems = await elevenlabs.getHistory();
      setHistory(historyItems);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handlePreview = async (voice: Voice) => {
    try {
      if (isPlaying === voice.id) {
        const audio = audioElements.get(voice.id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(null);
          return;
        }
      }

      const audioBlob = await elevenlabs.textToSpeech({
        text: previewText,
        voice_id: voice.id,
      }) as Blob;

      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setIsPlaying(null);
        URL.revokeObjectURL(url);
        audioElements.delete(voice.id);
      };

      audioElements.set(voice.id, audio);
      audio.play();
      setIsPlaying(voice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
    }
  };

  const handleShare = async (voice: Voice) => {
    try {
      const shareLink = await elevenlabs.shareVoice(voice.id);
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share voice');
    }
  };

  const handleDelete = async (voice: Voice) => {
    if (!confirm('Are you sure you want to delete this voice?')) return;

    try {
      await elevenlabs.deleteVoice(voice.id);
      setVoices(voices.filter(v => v.id !== voice.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice');
    }
  };

  const handleVoiceCreated = (voice: Voice) => {
    setVoices([...voices, voice]);
    setShowDesigner(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Voice Library</h2>
        <button
          onClick={() => setShowDesigner(true)}
          className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
        >
          Create New Voice
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Voice Preview Controls */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Preview Text</label>
        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
          rows={2}
        />
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voices.map(voice => (
          <div
            key={voice.id}
            className="p-4 border border-muted rounded-lg space-y-4 bg-background"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{voice.name}</h3>
                {voice.description && (
                  <p className="text-sm text-muted-foreground">{voice.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleShare(voice)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Share Voice"
                >
                  Share
                </button>
                <button
                  onClick={() => handleDelete(voice)}
                  className="p-2 text-red-500 hover:text-red-600 transition-colors"
                  title="Delete Voice"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handlePreview(voice)}
                className={`flex-1 px-4 py-2 ${
                  isPlaying === voice.id
                    ? 'bg-secondary text-button-text'
                    : 'bg-primary text-button-text'
                } rounded-md hover:bg-secondary transition-colors`}
              >
                {isPlaying === voice.id ? 'Stop' : 'Preview'}
              </button>
              <button
                onClick={() => {
                  setSelectedVoice(voice);
                  setShowDesigner(true);
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Voice Details */}
            <div className="text-sm space-y-1">
              {voice.category && (
                <p className="text-muted-foreground">Category: {voice.category}</p>
              )}
              {voice.labels && Object.entries(voice.labels).map(([key, value]) => (
                <p key={key} className="text-muted-foreground">
                  {key}: {value}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* History Section */}
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-semibold">Recent Generations</h3>
        <div className="space-y-2">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 border border-muted rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{item.voice_name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.date_unix * 1000).toLocaleString()}
                </p>
                <p className="text-sm">{item.text.substring(0, 100)}...</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const { audio } = await elevenlabs.getHistoryItem(item.id);
                      const url = URL.createObjectURL(audio);
                      const audioEl = new Audio(url);
                      audioEl.onended = () => URL.revokeObjectURL(url);
                      audioEl.play();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to play history item');
                    }
                  }}
                  className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={async () => {
                    try {
                      await elevenlabs.deleteHistoryItem(item.id);
                      setHistory(history.filter(h => h.id !== item.id));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to delete history item');
                    }
                  }}
                  className="px-4 py-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Designer Modal */}
      {showDesigner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-h-[90vh] overflow-y-auto">
            <VoiceDesigner
              onVoiceCreated={handleVoiceCreated}
              onClose={() => {
                setShowDesigner(false);
                setSelectedVoice(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}