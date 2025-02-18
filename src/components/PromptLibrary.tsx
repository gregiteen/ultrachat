import React, { useState, useEffect } from 'react';
import { Folder, Search, Tag, ChevronRight, ChevronDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromptStore } from '../store/promptStore';
import type { Prompt, Category } from '../types/prompts';

export function PromptLibrary({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { prompts, categories, loading, error, fetchPrompts, toggleFavorite } = usePromptStore();

  // Fetch prompts when component mounts
  useEffect(() => {
    if (isOpen) {
      console.log('Fetching prompts...');
      fetchPrompts();
    }
  }, [isOpen, fetchPrompts]);

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
          className={`flex items-center w-full p-2 hover:bg-gray-100 rounded-lg transition-colors ${
            level > 0 ? 'ml-4' : ''
          }`}
        >
          {hasSubcategories ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <Folder size={16} className="text-gray-400" />
          )}
          <span className="ml-2 text-sm">{category.name}</span>
          {categoryPrompts.length > 0 && (
            <span className="ml-auto text-xs text-gray-500">
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
                    className={`flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer ${
                      level > 0 ? 'ml-8' : 'ml-4'
                    }`}
                  >
                    <span className="text-sm truncate flex-1">{prompt.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Star size={14} className={prompt.favorite ? 'text-yellow-400 fill-current' : 'text-gray-400'} />
                    </button>
                    <div className="flex space-x-1 ml-2">
                      {prompt.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
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
      className={`fixed inset-y-0 right-0 w-80 bg-white shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Prompt Library</h2>
        <div className="mt-2 relative">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-8 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search size={16} className="absolute left-2 top-3 text-gray-400" />
          <Tag size={16} className="absolute right-2 top-3 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-120px)]">
        {loading ? (
          <div className="text-center text-gray-500">Loading prompts...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500">No prompts yet</div>
        ) : (
          getCategoryChildren(undefined).map(category => renderCategory(category))
        )}
      </div>
    </div>
  );
}