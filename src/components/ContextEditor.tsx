import React, { useState } from 'react';
import { useContextStore } from '../store/context';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Context } from '../types';
import { VoiceSection } from './context/VoiceSection';
import { AIPersonalitySection } from './context/AIPersonalitySection';
import { FileUploadSection } from './context/FileUploadSection';
import { KeywordsSection } from './context/KeywordsSection';

interface ContextEditorProps {
  onClose: () => void;
  initialContext?: Context;
}

export default function ContextEditor({ onClose, initialContext }: ContextEditorProps) {
  const { createContext, updateContext, deleteContext } = useContextStore();
  const [name, setName] = useState(initialContext?.name || '');
  const [loading, setLoading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState(
    initialContext?.content ||
    'I am an AI assistant focused on providing exceptional support through clear communication and proactive problem-solving.'
  );
  const [aiName, setAiName] = useState(initialContext?.ai_name || '');
  const [voice, setVoice] = useState(initialContext?.voice || {
    name: '',
    settings: {
      stability: 0.75,
      similarity_boost: 0.75
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const contextData = {
        name,
        ai_name: aiName,
        content: customInstructions,
        voice,
        is_active: true
      };

      if (initialContext?.id) {
        await updateContext(initialContext.id, contextData);
      } else {
        await createContext(name, customInstructions);
      }
      onClose();
    } catch (error) {
      console.error('Error saving assistant:', error);
      alert('Failed to save assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialContext?.id || !window.confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteContext(initialContext.id);
      onClose();
    } catch (error) {
      console.error('Error deleting assistant:', error);
      alert('Failed to delete assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {initialContext ? 'Edit Assistant' : 'Create Assistant'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g., Technical Support Assistant"
                required
              />
            </div>

            <div>
              <label htmlFor="ai-name" className="block text-sm font-medium text-foreground mb-1">
                AI Name
              </label>
              <input
                id="ai-name"
                type="text"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g., Jarvis"
              />
            </div>

            <VoiceSection voice={voice} setVoice={setVoice} />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Custom Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary h-32 resize-none"
                placeholder="Instructions for how the AI assistant should behave"
              />
            </div>

            <FileUploadSection
              onChange={(paths) => {
                if (initialContext?.id) {
                  updateContext(initialContext.id, { files: paths });
                }
              }}
            />

            <div className="flex justify-between pt-4">
              {initialContext?.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Assistant
                </button>
              )}
              <div className="flex gap-4 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-muted rounded-md hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Assistant'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}