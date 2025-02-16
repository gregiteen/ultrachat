import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResultProps {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevanceScore: number;
}

export function SearchResult({ title, link, snippet, source, relevanceScore }: SearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="border border-muted rounded-lg p-3 mb-2 bg-background hover:bg-muted/5 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground">{title}</h3>
            <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
              {Math.round(relevanceScore * 100)}% relevant
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{source}</span>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Visit
            </a>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-muted-foreground border-t border-muted pt-2">
              {snippet}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SearchResultsProps {
  summary: string;
  sources: SearchResultProps[];
  followUps: Array<{
    text: string;
    type: 'clarification' | 'deeper' | 'related';
  }>;
  onFollowUpClick: (question: string) => void;
}

export function SearchResults({ summary, sources, followUps, onFollowUpClick }: SearchResultsProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-muted/10 rounded-lg p-4 border border-muted">
        <p className="text-foreground">{summary}</p>
      </div>

      {/* Sources */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Sources</h3>
        {sources.map((source, index) => (
          <SearchResult key={index} {...source} />
        ))}
      </div>

      {/* Follow-up Questions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Follow-up Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {followUps.map((followUp, index) => (
            <motion.button
              key={index}
              onClick={() => onFollowUpClick(followUp.text)}
              className={`text-left p-2 rounded-lg text-sm transition-colors ${
                followUp.type === 'clarification'
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700'
                  : followUp.type === 'deeper'
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {followUp.text}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}