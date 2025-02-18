import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Slack, Github, Mail, Copy, Download, Twitter } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: (content: string) => Promise<void>;
  description: string;
}

export function ShareDialog({ isOpen, onClose, content }: ShareDialogProps) {
  const shareOptions: ShareOption[] = [
    {
      id: 'slack',
      name: 'Slack',
      icon: <Slack className="w-5 h-5" />,
      action: async (text) => {
        // TODO: Implement Slack sharing
        console.log('Share to Slack:', text);
      },
      description: 'Share to a Slack channel or direct message'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      action: async (text) => {
        // TODO: Implement GitHub sharing
        console.log('Share to GitHub:', text);
      },
      description: 'Create a GitHub Gist or issue'
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: async (text) => {
        const subject = 'Shared from UltraChat';
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      },
      description: 'Send via email'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      action: async (text) => {
        const tweet = text.slice(0, 280); // Twitter character limit
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
      },
      description: 'Share on Twitter (truncated to 280 characters)'
    },
    {
      id: 'copy',
      name: 'Copy',
      icon: <Copy className="w-5 h-5" />,
      action: async (text) => {
        await navigator.clipboard.writeText(text);
        // TODO: Show toast notification
      },
      description: 'Copy to clipboard'
    },
    {
      id: 'download',
      name: 'Download',
      icon: <Download className="w-5 h-5" />,
      action: async (text) => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ultrachat-response.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      description: 'Download as text file'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Share Response</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Share Options */}
            <div className="p-4 grid grid-cols-2 gap-4">
              {shareOptions.map(option => (
                <motion.button
                  key={option.id}
                  onClick={() => option.action(content)}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    {option.icon}
                  </div>
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Preview */}
            <div className="p-4 border-t bg-gray-50">
              <div className="text-sm font-medium mb-2">Preview:</div>
              <div className="text-sm text-gray-600 max-h-32 overflow-y-auto rounded bg-white p-2 border">
                {content.length > 200
                  ? content.slice(0, 200) + '...'
                  : content}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}