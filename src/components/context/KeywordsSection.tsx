import { useState } from 'react';
import type { ContextKeyword } from '../../types';

interface KeywordsSectionProps {
  keywords: ContextKeyword[];
  setKeywords: (keywords: ContextKeyword[]) => void;
}

export function KeywordsSection({ keywords, setKeywords }: KeywordsSectionProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const handleAddKeyword = () => {
    if (!newKeyword || !newPrompt) return;

    setKeywords([
      ...keywords,
      {
        keyword: newKeyword,
        prompt: newPrompt,
      },
    ]);

    // Reset form
    setNewKeyword('');
    setNewPrompt('');
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Keywords</h3>
      <p className="text-sm text-muted-foreground">
        Define trigger words and their corresponding actions.
      </p>

      <div className="space-y-2">
        {keywords.map((keyword, index) => (
          <div key={index} className="flex items-center gap-4 p-2 bg-muted/5 rounded-md">
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium">When I say</span>
              <span className="text-primary">{keyword.keyword}</span>
              <span className="font-medium">you do</span>
              <span>{keyword.prompt}</span>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveKeyword(index)}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4 p-2 bg-muted/5 rounded-md">
        <div className="flex-1">
          <label htmlFor="new-keyword" className="block text-sm font-medium text-foreground mb-1">
            When I say
          </label>
          <input
            id="new-keyword"
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="e.g., 'schedule meeting'"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="new-prompt" className="block text-sm font-medium text-foreground mb-1">
            You do
          </label>
          <input
            id="new-prompt"
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="e.g., 'Open calendar and schedule'"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddKeyword}
            disabled={!newKeyword || !newPrompt}
            className="px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}