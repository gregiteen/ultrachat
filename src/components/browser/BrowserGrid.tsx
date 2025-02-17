import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, X, Play, Pause, Volume2, SkipForward, SkipBack } from 'lucide-react';
import { useContextStore } from '../../store/context';

interface BrowserSession {
  id: string;
  url: string;
  title: string;
  screenshot?: string;
  isActive: boolean;
  isPlaying?: boolean;
  isMedia?: boolean;
  progress?: number;
  duration?: number;
}

interface BrowserGridProps {
  sessions: BrowserSession[];
  onSessionClick: (session: BrowserSession) => void;
  onSessionClose: (session: BrowserSession) => void;
  onMediaControl?: (session: BrowserSession, action: 'play' | 'pause' | 'next' | 'prev') => void;
  layout?: '2x2' | '3x3';
}

export function BrowserGrid({
  sessions,
  onSessionClick,
  onSessionClose,
  onMediaControl,
  layout = '2x2'
}: BrowserGridProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const { activeContext } = useContextStore();

  const gridClass = layout === '2x2' 
    ? 'grid-cols-2' 
    : 'grid-cols-3';

  const handleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const renderMediaControls = (session: BrowserSession) => {
    if (!session.isMedia) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMediaControl?.(session, session.isPlaying ? 'pause' : 'play');
          }}
          className="p-1 hover:bg-white/20 rounded"
        >
          {session.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${(session.progress || 0) * 100}%` }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMediaControl?.(session, 'prev');
          }}
          className="p-1 hover:bg-white/20 rounded"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMediaControl?.(session, 'next');
          }}
          className="p-1 hover:bg-white/20 rounded"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <Volume2 className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className={`grid ${gridClass} gap-4 p-4`}>
      <AnimatePresence>
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              gridColumn: expandedSession === session.id ? '1 / -1' : 'auto',
              gridRow: expandedSession === session.id ? 'span 2' : 'auto'
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`
              relative rounded-lg border border-muted overflow-hidden
              ${session.isActive ? 'ring-2 ring-primary' : ''}
              ${expandedSession === session.id ? 'h-[600px]' : 'h-[300px]'}
              cursor-pointer transition-all duration-200
            `}
            onClick={() => onSessionClick(session)}
          >
            {/* Screenshot or Content */}
            {session.screenshot ? (
              <img 
                src={session.screenshot} 
                alt={session.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            )}

            {/* Title Bar */}
            <div className="absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeContext?.voice?.id && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Volume2 className="h-3 w-3 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {session.title || session.url}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpand(session.id);
                  }}
                  className="p-1 hover:bg-muted rounded"
                >
                  {expandedSession === session.id ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionClose(session);
                  }}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Media Controls */}
            {renderMediaControls(session)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}