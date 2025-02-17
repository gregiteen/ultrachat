import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { elevenlabs, type Voice } from '../../lib/elevenlabs';
import { Mic, Play, Pause, Settings, Trash2, Plus, Volume2, Edit2 } from 'lucide-react';
import { VoiceCloner } from './VoiceCloner';
import { VoiceDesigner } from './VoiceDesigner';

interface VoiceCardProps {
  voice: Voice;
  onPlay: (voice: Voice) => void;
  onStop: () => void;
  onEdit: (voice: Voice) => void;
  onDelete: (voice: Voice) => void;
  onSelect?: (voice: Voice) => void;
  isPlaying: boolean;
}

function VoiceCard({ voice, onPlay, onStop, onEdit, onDelete, onSelect, isPlaying }: VoiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative bg-background border border-muted rounded-xl overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect?.(voice)}
      layout
    >
      <div className="p-4 space-y-4">
        {/* Voice Avatar */}
        <div className="relative w-24 h-24 mx-auto">
          {voice.preview_url ? (
            <img
              src={voice.preview_url}
              alt={voice.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
          )}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => isPlaying ? onStop() : onPlay(voice)}
                  className="p-2 rounded-full bg-primary text-button-text hover:bg-secondary transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice Info */}
        <div className="text-center">
          <h3 className="font-semibold truncate">{voice.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {voice.category === 'cloned' ? 'Cloned Voice' : 
             voice.category === 'generated' ? 'Generated Voice' : 
             'Professional Voice'}
          </p>
        </div>

        {/* Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(voice)}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                title="Edit voice"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(voice)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                title="Delete voice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface VoiceGalleryProps {
  onVoiceSelect?: (voice: Voice) => void;
  onClose?: () => void;
  standalone?: boolean;
}

export function VoiceGallery({ onVoiceSelect, onClose, standalone = true }: VoiceGalleryProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCloner, setShowCloner] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<Voice | null>(null);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const voiceList = await elevenlabs.getVoices();
      setVoices(voiceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (voice: Voice) => {
    try {
      setPlayingVoice(voice);
      await elevenlabs.textToSpeech({
        text: 'Hello, this is a sample of my voice.',
        voice_id: voice.id,
      });
    } catch (err) {
      console.error('Error playing voice:', err);
    }
  };

  const handleStop = () => {
    setPlayingVoice(null);
  };

  const handleDelete = async (voice: Voice) => {
    if (window.confirm(`Are you sure you want to delete ${voice.name}?`)) {
      try {
        await elevenlabs.deleteVoice(voice.id);
        setVoices(voices.filter(v => v.id !== voice.id));
      } catch (err) {
        console.error('Error deleting voice:', err);
      }
    }
  };

  const handleVoiceCreated = (voice: Voice) => {
    setVoices([...voices, voice]);
    setShowCloner(false);
    setShowDesigner(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Voice Gallery</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDesigner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-button-text rounded-lg hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Design Voice
          </button>
          <button
            onClick={() => setShowCloner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-button-text rounded-lg hover:bg-secondary transition-colors"
          >
            <Mic className="w-4 h-4" />
            Clone Voice
          </button>
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {voices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            onPlay={handlePlay}
            onStop={handleStop}
            onEdit={setEditingVoice}
            onDelete={handleDelete}
            onSelect={onVoiceSelect}
            isPlaying={playingVoice?.id === voice.id}
          />
        ))}
      </div>

      {/* Close Button (when used as modal) */}
      {!standalone && onClose && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCloner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <VoiceCloner
              onVoiceCreated={handleVoiceCreated}
              onClose={() => setShowCloner(false)}
            />
          </motion.div>
        )}

        {showDesigner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <VoiceDesigner
              onVoiceCreated={handleVoiceCreated}
              onClose={() => setShowDesigner(false)}
            />
          </motion.div>
        )}

        {editingVoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <VoiceCloner
              initialVoice={editingVoice}
              onVoiceCreated={(voice) => {
                setVoices(voices.map(v => v.id === voice.id ? voice : v));
                setEditingVoice(null);
              }}
              onClose={() => setEditingVoice(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}