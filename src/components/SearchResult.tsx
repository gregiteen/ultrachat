import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Award, Book, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface SearchResultProps {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevanceScore: number;
  citationIndex?: number;
}

function getDomainTrustIcon(domain: string) {
  if (domain.endsWith('.edu')) return <Book className="h-4 w-4 text-blue-500" aria-label="Academic Source" />;
  if (domain.endsWith('.gov')) return <Award className="h-4 w-4 text-purple-500" aria-label="Government Source" />;
  if (domain.endsWith('.org')) return <Award className="h-4 w-4 text-green-500" aria-label="Organization" />;
  return <Globe className="h-4 w-4 text-gray-500" aria-label="Website" />;
}

function getDomainTrustLabel(domain: string) {
  if (domain.endsWith('.edu')) return 'Academic Source';
  if (domain.endsWith('.gov')) return 'Government Source';
  if (domain.endsWith('.org')) return 'Organization';
  if (['github.com', 'stackoverflow.com', 'medium.com'].includes(domain)) return 'Technical Resource';
  return 'Website';
}

export function SearchResult({ title, link, snippet, source, relevanceScore, citationIndex }: SearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const domain = new URL(link).hostname;
  const trustIcon = getDomainTrustIcon(domain);
  const trustLabel = getDomainTrustLabel(domain);

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
            {citationIndex !== undefined && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                [{citationIndex}]
              </span>
            )}
            <h3 className="font-medium text-foreground">{title}</h3>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              {trustIcon}
              <span>{trustLabel}</span>
            </div>
            <span>•</span>
            <span>{source}</span>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" aria-label="Open in new tab" />
              Visit
            </a>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isExpanded ? "Show less" : "Show more"}
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
    <div className="space-y-6">
      {/* Summary with Markdown Support */}
      <div className="bg-muted/10 rounded-lg p-4 border border-muted prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>

      {/* Sources with Citation Numbers */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Sources</h3>
        {sources.map((source, index) => (
          <SearchResult key={index} {...source} citationIndex={index + 1} />
        ))}
      </div>

      {/* Follow-up Questions */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Explore Further</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {followUps.map((followUp, index) => (
            <motion.button
              key={index}
              onClick={() => onFollowUpClick(followUp.text)}
              className={`text-left p-2 rounded-lg text-sm transition-colors ${
                followUp.type === 'clarification'
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : followUp.type === 'deeper'
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300'
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