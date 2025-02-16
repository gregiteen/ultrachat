import React, { useState } from 'react';
import { Mail, Send, Inbox, Settings, RefreshCw } from 'lucide-react';
import { useIntegrationsStore } from '../../store/integrations';

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  timestamp: string;
  read: boolean;
  labels?: string[];
}

export function EmailIntegration() {
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { integrations, connectGmail, connectOutlook, disconnectIntegration } = useIntegrationsStore();

  const emailIntegration = integrations.find(i => i.type === 'gmail' || i.type === 'outlook');
  const isConnected = !!emailIntegration;

  const handleConnect = async (provider: 'gmail' | 'outlook') => {
    setIsConnecting(true);
    try {
      if (provider === 'gmail') {
        await connectGmail();
      } else {
        await connectOutlook();
      }
      setSelectedProvider(provider);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (emailIntegration) {
      await disconnectIntegration(emailIntegration.id);
      setSelectedProvider(null);
      setEmails([]);
    }
  };

  const refreshEmails = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement email fetching
      // const response = await fetchEmails();
      // setEmails(response.emails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Connect Email</h2>
        <div className="space-y-4">
          <button
            onClick={() => handleConnect('gmail')}
            disabled={isConnecting}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-muted hover:bg-muted transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span>Connect Gmail</span>
          </button>
          <button
            onClick={() => handleConnect('outlook')}
            disabled={isConnecting}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-muted hover:bg-muted transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span>Connect Outlook</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-muted p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {selectedProvider === 'gmail' ? 'Gmail' : 'Outlook'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshEmails}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {}} // TODO: Implement settings
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-muted p-4">
          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors">
              <Inbox className="h-4 w-4" />
              <span>Inbox</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors">
              <Send className="h-4 w-4" />
              <span>Sent</span>
            </button>
          </nav>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-auto">
          {emails.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No emails to display
            </div>
          ) : (
            <div className="divide-y divide-muted">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="p-4 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${!email.read ? 'font-bold' : ''}`}>
                        {email.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {email.from}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(email.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}