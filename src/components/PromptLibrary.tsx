import React, { useState, useEffect } from 'react';
import { Folder, Search, Tag, ChevronRight, ChevronDown, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromptStore } from '../store/promptStore';
import type { Prompt, Category } from '../types/prompts';
import { Spinner } from '../design-system/components/feedback/Spinner';

export function PromptLibrary({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { prompts, categories, loading, error, fetchPrompts, toggleFavorite, initialized } = usePromptStore();

  // Fetch prompts when component mounts
  useEffect(() => {
    if (isOpen && !initialized && !loading) {
      console.log('Fetching prompts...');
      fetchPrompts().catch(console.error);
    }
  }, [isOpen, initialized, loading, fetchPrompts]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Filter prompts based on search query
  const filteredPrompts = searchQuery
    ? prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : prompts;

  // Organize categories into hierarchy
  const getCategoryChildren = (parentId?: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  // Get prompts for a category
  const getCategoryPrompts = (categoryId: string) =>
    filteredPrompts.filter(p => p.category === categoryId);

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const subcategories = getCategoryChildren(category.id);
    const hasSubcategories = subcategories.length > 0;
    const categoryPrompts = getCategoryPrompts(category.id);
    const hasPrompts = categoryPrompts.length > 0;

    return (
      <div key={category.name} className="mb-2">
        <button
          onClick={() => toggleCategory(category.name)}
          className={`flex items-center w-full p-2 hover:bg-muted/50 rounded-lg transition-colors ${
            level > 0 ? 'ml-4' : ''
          }`}
        >
          {hasSubcategories ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="ml-2 text-sm">{category.name}</span>
          {categoryPrompts.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {categoryPrompts.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {hasSubcategories &&
                subcategories.map(subcat =>
                  renderCategory(subcat, level + 1)
              )}
              {hasPrompts &&
                categoryPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className={`flex items-center p-2 hover:bg-muted/50 rounded-lg cursor-pointer ${
                      level > 0 ? 'ml-8' : 'ml-4'
                    }`}
                  >
                    <span className="text-sm truncate flex-1">{prompt.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Star className={`h-4 w-4 ${prompt.favorite ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} />
                    </button>
                    <div className="flex space-x-1 ml-2">
                      {prompt.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-background border-l border-muted shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-muted">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Prompt Library</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-8 py-2 bg-input-background rounded-lg text-sm border border-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Tag className="absolute right-2 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-120px)]">
        {!initialized || loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <div className="text-sm text-muted-foreground">
              Loading prompts...
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-sm text-destructive text-center">{error}</div>
            <button
              onClick={() => fetchPrompts()}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Folder className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground text-center">
              No prompts available yet.
              <br />
              Check back later for updates.
            </div>
          </div>
        ) : (
          getCategoryChildren(undefined).map(category => renderCategory(category))
        )}
      </div>
    </div>
  );
}