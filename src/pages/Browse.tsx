import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useMessageStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { Search, Globe, Send, X, Grid2x2, Grid3x3 } from 'lucide-react';
import { BrowserGrid } from '../components/browser/BrowserGrid';
import { v4 as uuidv4 } from 'uuid';

interface BrowserSession {
  id: string;
  url: string;
  title: string;
  screenshot?: string;
  isActive: boolean;
  isMedia?: boolean;
  isPlaying?: boolean;
  progress?: number;
  duration?: number;
}

export default function Browse() {
  const { user } = useAuthStore();
  const { sendMessage, messages, loading } = useMessageStore();
  const { activeContext, contexts } = useContextStore();
  const [input, setInput] = useState('');
  const [url, setUrl] = useState('');
  const [browserOpen, setBrowserOpen] = useState(false);
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [gridLayout, setGridLayout] = useState<'2x2' | '3x3'>('2x2');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const command = input.toLowerCase();
    
    try {
      // Send user message
      await sendMessage(input, [], activeContext?.id);
      setInput('');

      // Handle browsing commands
      if (command.includes('browse') || command.includes('search') || command.includes('look up')) {
        setBrowserOpen(true);
        // Let AI handle the browsing
        await sendMessage(`I'll help you browse for that information. Let me search and navigate through relevant pages.`, [], activeContext?.id, true);
        
        // Create new browser sessions based on AI's analysis
        const newSessions = Array(4).fill(0).map((_, index) => ({
          id: uuidv4(),
          url: `https://example.com/search/${index}`,
          title: `Search Result ${index + 1}`,
          isActive: index === 0,
          isMedia: index === 3, // Example media session
          progress: 0,
          duration: 300 // 5 minutes
        }));
        
        setSessions(prev => [...prev, ...newSessions]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartBrowsing = async () => {
    if (!url.trim()) return;
    setBrowserOpen(true);
    
    try {
      // Create new browser session
      const newSession: BrowserSession = {
        id: uuidv4(),
        url: url,
        title: url,
        isActive: true
      };

      // Deactivate other sessions
      setSessions(prev => prev.map(session => ({
        ...session,
        isActive: false
      })));

      // Add new session
      setSessions(prev => [...prev, newSession]);

      // Send browsing message
      await sendMessage(`I'll browse ${url} and analyze its contents for you.`, [], activeContext?.id, true);
      
      setUrl('');
    } catch (error) {
      console.error('Error sending browse request:', error);
    }
  };

  const handleSessionClick = (session: BrowserSession) => {
    // Update active session
    setSessions(prev => prev.map(s => ({
      ...s,
      isActive: s.id === session.id
    })));

    // Send message about focusing on this session
    sendMessage(`I'm now focusing on ${session.title}. Let me analyze this page for you.`, [], activeContext?.id, true);
  };

  const handleSessionClose = (session: BrowserSession) => {
    setSessions(prev => prev.filter(s => s.id !== session.id));
  };

  const handleMediaControl = (session: BrowserSession, action: 'play' | 'pause' | 'next' | 'prev') => {
    setSessions(prev => prev.map(s => {
      if (s.id !== session.id) return s;
      
      switch (action) {
        case 'play':
          return { ...s, isPlaying: true };
        case 'pause':
          return { ...s, isPlaying: false };
        case 'next':
          return { ...s, progress: Math.min((s.progress || 0) + 0.1, 1) };
        case 'prev':
          return { ...s, progress: Math.max((s.progress || 0) - 0.1, 0) };
        default:
          return s;
      }
    }));
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'assistant'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-button-text'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
                <span className="inline-block animate-bounce">•</span>
                <span className="inline-block animate-bounce delay-100">•</span>
                <span className="inline-block animate-bounce delay-200">•</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-muted p-4">
          {/* URL Input */}
          <div className="flex gap-2 mb-4 relative">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to browse..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-muted bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleStartBrowsing}
              disabled={!url.trim() || loading}
              className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
            > 
              Browse
            </button>
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                placeholder="Ask about what you're browsing..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-muted bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Browser Section */}
      <div className={`w-1/2 border-l border-muted flex flex-col transition-all duration-300 ${browserOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-2 border-b border-muted flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI Browser</span>
            {activeContext?.voice?.id && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {activeContext.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGridLayout(layout => layout === '2x2' ? '3x3' : '2x2')}
              className="p-1 hover:bg-muted rounded-md"
            >
              {gridLayout === '2x2' ? (
                <Grid2x2 className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setBrowserOpen(false)}
              className="p-1 hover:bg-muted rounded-md"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <BrowserGrid
            sessions={sessions}
            onSessionClick={handleSessionClick}
            onSessionClose={handleSessionClose}
            onMediaControl={handleMediaControl}
            layout={gridLayout}
          />
        </div>
      </div>
    </div>
  );
}