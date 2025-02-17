import React, { useEffect, useState } from 'react';
import { useIntegrationsStore } from '../../store/integrations';
import { Check, AlertCircle } from 'lucide-react';

interface APIKeyPattern {
  service: string;
  urlPattern: RegExp;
  keyPattern: RegExp;
}

// Patterns for detecting API keys from different services
const API_KEY_PATTERNS: APIKeyPattern[] = [
  {
    service: 'slack',
    urlPattern: /api\.slack\.com|slack\.com\/apps/,
    keyPattern: /xoxb-[0-9A-Za-z-]+/
  },
  {
    service: 'github',
    urlPattern: /github\.com\/settings\/tokens/,
    keyPattern: /ghp_[0-9A-Za-z]+/
  },
  {
    service: 'google',
    urlPattern: /console\.cloud\.google\.com\/apis\/credentials/,
    keyPattern: /[A-Za-z0-9_-]{39}/
  },
  {
    service: 'twitter',
    urlPattern: /developer\.twitter\.com/,
    keyPattern: /[1-9][0-9]*-[0-9A-Za-z]+/
  },
  {
    service: 'supabase',
    urlPattern: /app\.supabase\.com/,
    keyPattern: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/
  }
];

export function ClipboardMonitor() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const { connectIntegration } = useIntegrationsStore();

  useEffect(() => {
    let lastProcessedText = '';

    const handleClipboardChange = async () => {
      try {
        const text = await navigator.clipboard.readText();
        
        // Skip if we've already processed this text
        if (text === lastProcessedText) return;
        lastProcessedText = text;

        // Get the current URL
        const currentUrl = window.location.href;

        // Find matching service based on URL and key pattern
        for (const pattern of API_KEY_PATTERNS) {
          if (pattern.urlPattern.test(currentUrl) && pattern.keyPattern.test(text)) {
            // Found a match - attempt to connect the integration
            try {
              await connectIntegration(pattern.service, {
                name: 'UltraChat',
                apiKey: text
              });

              setNotification({
                type: 'success',
                message: `Successfully connected ${pattern.service} integration`
              });

              // Clear notification after 3 seconds
              setTimeout(() => setNotification(null), 3000);
              break;
            } catch (error) {
              setNotification({
                type: 'error',
                message: `Failed to connect ${pattern.service}: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring clipboard:', error);
      }
    };

    // Set up clipboard monitoring
    const interval = setInterval(handleClipboardChange, 1000);

    // Clean up
    return () => clearInterval(interval);
  }, [connectIntegration]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg
        ${notification.type === 'success' 
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
        }`}
    >
      {notification.type === 'success' ? (
        <Check className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {notification.message}
    </div>
  );
}