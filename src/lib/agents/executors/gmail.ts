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

export interface GmailCredentials {
  access_token: string;
  expires_at: number;
}

interface MessageHeader {
  name: string;
  value: string;
}

interface GapiMessage {
  id: string;
  threadId: string;
}

interface GapiMessageDetails {
  result: {
    id: string;
    threadId: string;
    payload?: {
      headers: MessageHeader[];
    };
    snippet?: string;
    internalDate: string;
    labelIds?: string[];
  };
}

declare global {
  interface Window {
    gapi: any;
  }
}

export class GmailExecutor {
  private accessToken: string;

  constructor(credentials: GmailCredentials) {
    this.accessToken = credentials.access_token;
  }

  private async loadGapiClient(): Promise<void> {
    if (!window.gapi?.client?.gmail) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = async () => {
          await new Promise<void>(r => window.gapi.load('client', r));
          await window.gapi.client.init({});
          await window.gapi.client.load('gmail', 'v1');
          resolve();
        };
        document.head.appendChild(script);
      });
    }
  }

  private async getGmailClient() {
    await this.loadGapiClient();
    window.gapi.client.setToken({
      access_token: this.accessToken
    });
    return window.gapi.client.gmail;
  }

  async listMessages(maxResults = 20): Promise<GmailMessage[]> {
    const gmail = await this.getGmailClient();
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });

    if (!response.result.messages) {
      return [];
    }

    const messages = await Promise.all(
      response.result.messages.map(async (message: GapiMessage) => {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        }) as GapiMessageDetails;

        const headers = details.result.payload?.headers as MessageHeader[];
        const subject = headers?.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from = headers?.find(h => h.name === 'From')?.value || '';
        const to = headers?.find(h => h.name === 'To')?.value?.split(',').map(addr => addr.trim()) || [];
        const body = details.result.snippet || '';

        return {
          id: message.id,
          threadId: message.threadId,
          subject,
          from,
          to,
          body,
          timestamp: new Date(parseInt(details.result.internalDate)).toISOString(),
          read: !details.result.labelIds?.includes('UNREAD'),
          labels: details.result.labelIds || [],
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
      resource: {
        raw: btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      },
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    const gmail = await this.getGmailClient();

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      resource: {
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