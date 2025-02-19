import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Slack, Github, Mail, Copy, Download, Twitter } from 'lucide-react';
import { useToastStore } from '../store/toastStore';

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
  const { showToast } = useToastStore();

  const shareOptions: ShareOption[] = [
    {
      id: 'slack',
      name: 'Slack',
      icon: <Slack className="w-5 h-5" />,
      action: async (text) => {
        // TODO: Implement Slack sharing
        showToast({
          message: 'Slack sharing will be available soon!',
          type: 'info',
          duration: 3000
        });
      },
      description: 'Share to a Slack channel or direct message'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      action: async (text) => {
        // TODO: Implement GitHub sharing
        showToast({
          message: 'GitHub sharing will be available soon!',
          type: 'info',
          duration: 3000
        });
      },
      description: 'Create a GitHub Gist or issue'
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: async (text) => {
        try {
          const subject = 'Shared from UltraChat';
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
          showToast({
            message: 'Content has been added to a new email',
            type: 'success'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to open email client';
          showToast({
            message: errorMessage,
            type: 'error'
          });
        }
      },
      description: 'Send via email'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      action: async (text) => {
        try {
          const tweet = text.slice(0, 280); // Twitter character limit
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
          showToast({
            message: 'Content has been prepared for tweeting',
            type: 'success'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to open Twitter';
          showToast({
            message: errorMessage,
            type: 'error'
          });
        }
      },
      description: 'Share on Twitter (truncated to 280 characters)'
    },
    {
      id: 'copy',
      name: 'Copy',
      icon: <Copy className="w-5 h-5" />,
      action: async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          showToast({
            message: 'Content copied to clipboard',
            type: 'success'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to copy to clipboard';
          showToast({
            message: errorMessage,
            type: 'error'
          });
        }
      },
      description: 'Copy to clipboard'
    },
    {
      id: 'download',
      name: 'Download',
      icon: <Download className="w-5 h-5" />,
      action: async (text) => {
        try {
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ultrachat-response.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast({
            message: 'Content saved as text file',
            type: 'success'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
          showToast({
            message: errorMessage,
            type: 'error'
          });
        }
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
                  onClick={async () => {
                    try {
                      await option.action(content);
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
                      showToast({
                        message: `Failed to ${option.name.toLowerCase()}: ${errorMessage}`,
                        type: 'error'
                      });
                    }
                  }}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}