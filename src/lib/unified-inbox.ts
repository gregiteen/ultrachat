import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument } from '../types/personalization';

interface InboxItem {
  id: string;
  type: 'message' | 'notification' | 'call' | 'email' | 'mention' | 'update' | 'generated';
  source: string;
  timestamp: string;
  content: {
    title: string;
    body?: string;
    preview?: string;
    attachments?: Array<{
      type: string;
      url: string;
      preview_url?: string;
    }>;
  };
  metadata: {
    priority: 'high' | 'medium' | 'low';
    read: boolean;
    archived: boolean;
    labels: string[];
    thread_id?: string;
    related_items?: string[];
  };
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
    handler?: string;
  }>;
}

export class UnifiedInbox {
  private static instance: UnifiedInbox;
  
  private constructor() {
    // Bind methods that are used as callbacks
    this.normalizeInboxItem = this.normalizeInboxItem.bind(this);
    this.determineItemType = this.determineItemType.bind(this);
    this.determineItemSource = this.determineItemSource.bind(this);
    this.determineItemPriority = this.determineItemPriority.bind(this);
    this.getItemActions = this.getItemActions.bind(this);
  }

  public static getInstance(): UnifiedInbox {
    if (!UnifiedInbox.instance) {
      UnifiedInbox.instance = new UnifiedInbox();
    }
    return UnifiedInbox.instance;
  }

  /**
   * Store item in appropriate service
   */
  private async storeItem(
    item: InboxItem,
    personalizationDoc: PersonalizationDocument
  ): Promise<InboxItem> {
    // Store in database
    const stored = await use_mcp_tool({
      server_name: 'supabase',
      tool_name: 'inbox.store',
      arguments: { item }
    });

    // Store attachments in Google Drive if configured
    if (
      item.content.attachments?.length &&
      personalizationDoc.integrations?.google_drive?.auto_save
    ) {
      const folder = personalizationDoc.integrations.google_drive.folder_structure?.[0] || 'Inbox Attachments';
      
      await Promise.all(
        item.content.attachments.map(attachment =>
          use_mcp_tool({
            server_name: 'google-drive',
            tool_name: 'file.create',
            arguments: {
              url: attachment.url,
              name: `${item.content.title} - ${attachment.type}`,
              folder: `${folder}/${item.type}`,
              sync: personalizationDoc.integrations?.google_drive?.sync_frequency || 'realtime',
              organization: personalizationDoc.integrations?.google_drive?.file_organization || 'auto'
            }
          })
        )
      );
    }

    return stored;
  }

  /**
   * Determine item type
   */
  private determineItemType(item: Record<string, any>): InboxItem['type'] {
    if (item.type) return item.type as InboxItem['type'];
    if (item.email) return 'email';
    if (item.message) return 'message';
    if (item.notification) return 'notification';
    if (item.call) return 'call';
    if (item.mention) return 'mention';
    if (item.generated) return 'generated';
    return 'notification';
  }

  /**
   * Determine item source
   */
  private determineItemSource(item: Record<string, any>): string {
    if (item.source) return item.source;
    if (item.email) return 'gmail';
    if (item.channel) return 'slack';
    if (item.repository) return 'github';
    if (item.generated) return 'ai';
    return 'system';
  }

  /**
   * Determine item priority
   */
  private determineItemPriority(item: Record<string, any>): InboxItem['metadata']['priority'] {
    if (item.priority) return item.priority as InboxItem['metadata']['priority'];
    if (item.urgent || item.important) return 'high';
    if (item.mention || item.pull_request) return 'medium';
    return 'low';
  }

  /**
   * Get item-specific actions
   */
  private getItemActions(item: InboxItem): InboxItem['actions'] {
    const actions: InboxItem['actions'] = [];

    switch (item.source) {
      case 'gmail':
        actions.push(
          { type: 'reply', label: 'Reply' },
          { type: 'forward', label: 'Forward' }
        );
        break;

      case 'slack':
        actions.push(
          { type: 'reply', label: 'Reply in Thread' },
          { type: 'react', label: 'Add Reaction' }
        );
        break;

      case 'github':
        actions.push(
          { type: 'view', label: 'View on GitHub', url: item.content.body },
          { type: 'approve', label: 'Approve' }
        );
        break;
    }

    // Common actions
    actions.push(
      { type: 'mark_read', label: 'Mark as Read' },
      { type: 'archive', label: 'Archive' },
      { type: 'create_task', label: 'Create Task' }
    );

    return actions;
  }

  /**
   * Normalize inbox item from different sources
   */
  private normalizeInboxItem(item: Record<string, any>): InboxItem {
    // Common fields all items should have
    const normalized: InboxItem = {
      id: item.id || Math.random().toString(36).substr(2, 9),
      type: this.determineItemType(item),
      source: this.determineItemSource(item),
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      content: {
        title: item.title || item.subject || 'Untitled',
        body: item.body || item.content || item.message,
        preview: item.preview,
        attachments: Array.isArray(item.attachments) ? item.attachments : []
      },
      metadata: {
        priority: this.determineItemPriority(item),
        read: Boolean(item.read || item.viewed),
        archived: Boolean(item.archived),
        labels: Array.isArray(item.labels) ? item.labels : 
               Array.isArray(item.tags) ? item.tags : [],
        thread_id: item.thread_id || item.conversation_id,
        related_items: Array.isArray(item.related_items) ? item.related_items : []
      }
    };

    // Add source-specific actions
    normalized.actions = this.getItemActions(normalized);

    return normalized;
  }
}

export const unifiedInbox = UnifiedInbox.getInstance();