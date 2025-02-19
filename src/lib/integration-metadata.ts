import type { IntegrationMetadata } from '../types/integration';

export const INTEGRATION_METADATA: Record<string, IntegrationMetadata> = {
  gmail: {
    name: 'Gmail',
    description: 'Send and receive emails, manage your inbox, and automate email workflows.',
    category: 'Communication',
    logo: { url: 'https://api.iconify.design/logos:google-gmail.svg', alt: 'Gmail Logo', width: 48, height: 48 },
    capabilities: [
      'Send emails',
      'Read inbox',
      'Manage labels',
      'Search emails',
      'Handle attachments'
    ],
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/gmail/api/guides',
  },
  
  slack: {
    name: 'Slack',
    description: 'Connect and collaborate with your team through channels, messages, and file sharing.',
    category: 'Communication',
    logo: { url: 'https://api.iconify.design/logos:slack-icon.svg', alt: 'Slack Logo', width: 48, height: 48 },
    capabilities: [
      'Send messages',
      'Create channels',
      'Share files',
      'Manage users',
      'Use slash commands'
    ],
    authType: 'oauth',
    docsUrl: 'https://api.slack.com/docs',
  },

  github: {
    name: 'GitHub',
    description: 'Manage repositories, issues, pull requests, and automate your development workflow.',
    category: 'Development',
    logo: { url: 'https://api.iconify.design/logos:github-icon.svg', alt: 'GitHub Logo', width: 48, height: 48 },
    capabilities: [
      'Manage repositories',
      'Handle issues',
      'Review PRs',
      'Trigger actions',
      'Manage projects'
    ],
    authType: 'oauth',
    docsUrl: 'https://docs.github.com/en/rest',
  },

  google_calendar: {
    name: 'Google Calendar',
    description: 'Schedule meetings, manage events, and coordinate with your team.',
    category: 'Productivity',
    logo: { url: 'https://api.iconify.design/logos:google-calendar.svg', alt: 'Google Calendar Logo', width: 48, height: 48 },
    capabilities: [
      'Create events',
      'Manage schedules',
      'Set reminders',
      'Handle invites',
      'Check availability'
    ],
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/calendar/api/guides/overview',
  },

  outlook: {
    name: 'Outlook',
    description: 'Manage your emails, calendar, and contacts with Microsoft Outlook integration.',
    category: 'Communication',
    logo: { url: 'https://api.iconify.design/logos:microsoft-outlook.svg', alt: 'Outlook Logo', width: 48, height: 48 },
    capabilities: [
      'Send emails',
      'Manage calendar',
      'Handle contacts',
      'Create tasks',
      'Set meetings'
    ],
    authType: 'oauth',
    docsUrl: 'https://docs.microsoft.com/en-us/outlook/rest/get-started',
  },

  google_drive: {
    name: 'Google Drive',
    description: 'Store, sync, and share files securely in the cloud.',
    category: 'Storage',
    logo: { url: 'https://api.iconify.design/logos:google-drive.svg', alt: 'Google Drive Logo', width: 48, height: 48 },
    capabilities: [
      'Upload files',
      'Share documents',
      'Manage permissions',
      'Search content',
      'Version control'
    ],
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/drive/api/guides/about-sdk',
  },

  feedly: {
    name: 'Feedly',
    description: 'Track and organize content from your favorite sources.',
    category: 'Productivity',
    logo: { url: 'https://api.iconify.design/simple-icons:feedly.svg', alt: 'Feedly Logo', width: 48, height: 48 },
    capabilities: [
      'Follow sources',
      'Save articles',
      'Create boards',
      'Share content',
      'Track topics'
    ],
    authType: 'apiKey',
    apiKeyUrl: 'https://feedly.com/v3/auth/dev',
    apiKeyPlaceholder: 'feedly.access_token',
    apiKeyInstructions: 'Generate a developer token from your Feedly account settings.',
    docsUrl: 'https://developer.feedly.com',
  },

  google_maps: {
    name: 'Google Maps',
    description: 'Integrate location services and mapping functionality.',
    category: 'Productivity',
    logo: { url: 'https://api.iconify.design/logos:google-maps.svg', alt: 'Google Maps Logo', width: 48, height: 48 },
    capabilities: [
      'Location search',
      'Distance calculation',
      'Route planning',
      'Place details',
      'Geocoding'
    ],
    authType: 'apiKey',
    apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
    apiKeyPlaceholder: 'AIza...',
    apiKeyInstructions: 'Create an API key in the Google Cloud Console with Maps API access.',
    docsUrl: 'https://developers.google.com/maps/documentation',
  }
};

export function getIntegrationMetadata(type: string): IntegrationMetadata {
  const metadata = INTEGRATION_METADATA[type];
  if (!metadata) {
    // Return default metadata for custom integrations
    return {
      name: 'Custom Integration',
      description: 'Custom integration with your own API endpoint.',
      category: 'Custom',
      logo: { url: 'https://api.iconify.design/mdi:api.svg', alt: 'Custom Integration', width: 48, height: 48 },
      capabilities: ['Custom API access'],
      authType: 'apiKey',
    };
  }
  return metadata;
}

export function getIntegrationsByCategory(category?: string): [string, IntegrationMetadata][] {
  const entries = Object.entries(INTEGRATION_METADATA);
  if (!category || category === 'all') {
    return entries;
  }
  return entries.filter(([_, meta]) => meta.category === category);
}

export function getCategories(): string[] {
  const categories = new Set(Object.values(INTEGRATION_METADATA).map(meta => meta.category));
  return ['all', ...Array.from(categories)];
}