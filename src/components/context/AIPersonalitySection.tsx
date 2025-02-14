import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AITrait } from '../../types';

interface AIPersonalitySectionProps {
  aiTraits: AITrait[];
  setAiTraits: (traits: AITrait[]) => void;
  newTrait: Partial<AITrait>;
  setNewTrait: (trait: Partial<AITrait>) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
}

export function AIPersonalitySection({
  aiTraits,
  setAiTraits,
  newTrait,
  setNewTrait,
  customInstructions,
  setCustomInstructions,
}: AIPersonalitySectionProps) {
  const handleAddTrait = () => {
    if (newTrait.label && newTrait.description) {
      setAiTraits([
        ...aiTraits,
        {
          id: crypto.randomUUID(),
          label: newTrait.label,
          description: newTrait.description,
          level: newTrait.level || 50,
        },
      ]);
      setNewTrait({});
    }
  };

  const handleRemoveTrait = (id: string) => {
    setAiTraits(aiTraits.filter((t) => t.id !== id));
  };

  const handleTraitLevelChange = (id: string, level: number) => {
    setAiTraits(
      aiTraits.map((t) =>
        t.id === id ? { ...t, level: Math.min(100, Math.max(0, level)) } : t
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Core Traits
        </label>
        <div className="space-y-4">
          {aiTraits.map((trait) => (
            <div key={trait.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{trait.label}</span>
                  <button
                    onClick={() => handleRemoveTrait(trait.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {trait.description}
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trait.level}
                  onChange={(e) =>
                    handleTraitLevelChange(trait.id, parseInt(e.target.value))
                  }
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>{trait.level}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newTrait.label || ''}
                onChange={(e) =>
                  setNewTrait({ ...newTrait, label: e.target.value })
                }
                placeholder="New trait name"
                className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newTrait.description || ''}
                onChange={(e) =>
                  setNewTrait({ ...newTrait, description: e.target.value })
                }
                placeholder="Trait description"
                className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
              />
            </div>
            <button
              onClick={handleAddTrait}
              disabled={!newTrait.label || !newTrait.description}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Core Identity
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder="Describe the AI's core identity and purpose..."
        />
      </div>
    </div>
  );
}