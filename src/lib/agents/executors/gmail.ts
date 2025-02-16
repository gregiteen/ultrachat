import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  timestamp: string;
  read: boolean;
  labels: string[];
}

interface GmailCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface MessageHeader {
  name: string;
  value: string;
}

export class GmailExecutor {
  private oauth2Client: OAuth2Client;

  constructor(credentials: GmailCredentials) {
    this.oauth2Client = new OAuth2Client({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    });

    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expires_at,
    });
  }

  private async getGmailClient() {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    return gmail;
  }

  async listMessages(maxResults = 20): Promise<GmailMessage[]> {
    const gmail = await this.getGmailClient();
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });

    if (!response.data.messages) {
      return [];
    }

    const messages = await Promise.all(
      response.data.messages.map(async (message) => {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });

        const headers = details.data.payload?.headers as MessageHeader[];
        const subject = headers?.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from = headers?.find(h => h.name === 'From')?.value || '';
        const to = headers?.find(h => h.name === 'To')?.value?.split(',').map(addr => addr.trim()) || [];
        const body = details.data.snippet || '';

        return {
          id: message.id!,
          threadId: message.threadId!,
          subject,
          from,
          to,
          body,
          timestamp: new Date(parseInt(details.data.internalDate!)).toISOString(),
          read: !details.data.labelIds?.includes('UNREAD'),
          labels: details.data.labelIds || [],
        };
      })
    );

    return messages;
  }

  async sendMessage(options: {
    to: string[];
    subject: string;
    body: string;
  }): Promise<void> {
    const gmail = await this.getGmailClient();

    const message = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      `To: ${options.to.join(', ')}\n`,
      `Subject: ${options.subject}\n\n`,
      options.body,
    ].join('');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(message).toString('base64url'),
      },
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    const gmail = await this.getGmailClient();

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    const gmail = await this.getGmailClient();

    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });
  }
}