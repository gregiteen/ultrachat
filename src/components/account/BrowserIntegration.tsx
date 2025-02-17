import React from 'react';
import { Globe, CheckCircle2 } from 'lucide-react';
import { browser_action } from '../../lib/browser';

interface BrowserIntegrationProps {
  url: string;
  username?: string;
  password: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function BrowserIntegration({ url, username, password, onSuccess, onError }: BrowserIntegrationProps) {
  const handleAutoFill = async () => {
    try {
      // Launch browser at the target URL
      await browser_action({
        action: 'launch',
        url: url
      });

      // Wait for page load and look for common login form fields
      const selectors = {
        username: [
          'input[type="email"]',
          'input[type="text"]',
          'input[name="username"]',
          'input[name="email"]',
          'input[id*="username"]',
          'input[id*="email"]'
        ],
        password: [
          'input[type="password"]',
          'input[name="password"]',
          'input[id*="password"]'
        ],
        submit: [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:contains("Sign in")',
          'button:contains("Log in")'
        ]
      };

      // If username is provided, find and fill username field
      if (username) {
        for (const selector of selectors.username) {
          try {
            // Click the field
            await browser_action({
              action: 'click',
              coordinate: selector
            });
            
            // Type the username
            await browser_action({
              action: 'type',
              text: username
            });
            
            break;
          } catch (e) {
            continue;
          }
        }
      }

      // Find and fill password field
      for (const selector of selectors.password) {
        try {
          // Click the field
          await browser_action({
            action: 'click',
            coordinate: selector
          });
          
          // Type the password
          await browser_action({
            action: 'type',
            text: password
          });
          
          break;
        } catch (e) {
          continue;
        }
      }

      // Find and click submit button
      for (const selector of selectors.submit) {
        try {
          await browser_action({
            action: 'click',
            coordinate: selector
          });
          break;
        } catch (e) {
          continue;
        }
      }

      // Close browser
      await browser_action({
        action: 'close'
      });

      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Auto-fill failed');
      
      // Ensure browser is closed on error
      try {
        await browser_action({
          action: 'close'
        });
      } catch (e) {
        // Ignore close errors
      }
    }
  };

  return (
    <button
      onClick={handleAutoFill}
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Globe className="h-4 w-4" />
      Auto-fill Login
    </button>
  );
}