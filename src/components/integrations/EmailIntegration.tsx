import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { useIntegrationsStore } from '../../store/integrations';
import type { GmailMessage } from '../../lib/agents/executors/gmail';

interface ComposeEmailProps {
  onSend: (options: { to: string[]; subject: string; body: string }) => Promise<void>;
  onCancel: () => void;
}

function ComposeEmail({ onSend, onCancel }: ComposeEmailProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setSending(true);
    try {
      await onSend({
        to: to.split(',').map(email => email.trim()),
        subject,
        body,
      });
      onCancel();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Compose Email</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">To:</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-muted"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-muted h-48"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !to || !subject || !body}
              className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmailIntegration() {
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const { integrations, connectGmail, connectOutlook, disconnectIntegration, getGmailExecutor } = useIntegrationsStore();

  const emailIntegration = integrations.find(i => i.type === 'gmail' || i.type === 'outlook');
  const isConnected = !!emailIntegration;

  useEffect(() => {
    if (isConnected) {
      setSelectedProvider(emailIntegration.type as 'gmail' | 'outlook');
      refreshEmails();
    }
  }, [isConnected, emailIntegration?.type]);

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
      await disconnectIntegration(emailIntegration.type);
      setSelectedProvider(null);
      setEmails([]);
    }
  };

  const refreshEmails = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const executor = await getGmailExecutor();
      if (!executor) {
        throw new Error('Failed to initialize email executor');
      }
      const messages = await executor.listMessages();
      setEmails(messages);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async (options: { to: string[]; subject: string; body: string }) => {
    const executor = await getGmailExecutor();
    if (!executor) {
      throw new Error('Failed to initialize email executor');
    }
    await executor.sendMessage(options);
    await refreshEmails();
  };

  const handleMarkAsRead = async (messageId: string) => {
    const executor = await getGmailExecutor();
    if (!executor) return;
    await executor.markAsRead(messageId);
    setEmails(emails.map(email =>
      email.id === messageId ? { ...email, read: true } : email
    ));
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
            onClick={() => setShowCompose(true)}
            className="px-3 py-1 bg-primary text-button-text rounded-md hover:bg-primary/90"
          >
            Compose
          </button>
          <button
            onClick={refreshEmails}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Disconnect"
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
                  onClick={() => !email.read && handleMarkAsRead(email.id)}
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {email.body}
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

      {showCompose && (
        <ComposeEmail
          onSend={handleSendEmail}
          onCancel={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}