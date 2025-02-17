import React, { useState } from 'react';
import { useIntegrationsStore } from '../../store/integrations';
import { ClipboardMonitor } from './ClipboardMonitor';
import { Lock, ExternalLink } from 'lucide-react';

interface IntegrationConfig {
  name: string;
  category: 'communication' | 'productivity' | 'social' | 'development' | 'storage' | 'media' | 'database';
  logo: string;
  apiKeyUrl: string;
  docsUrl: string;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    name: 'Slack',
    category: 'communication',
    logo: 'https://cdn.simpleicons.org/slack',
    apiKeyUrl: 'https://api.slack.com/apps',
    docsUrl: 'https://api.slack.com/docs',
  },
  {
    name: 'GitHub',
    category: 'development',
    logo: 'https://cdn.simpleicons.org/github',
    apiKeyUrl: 'https://github.com/settings/tokens',
    docsUrl: 'https://docs.github.com/rest',
  },
  {
    name: 'Google Drive',
    category: 'storage',
    logo: 'https://cdn.simpleicons.org/googledrive',
    apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
    docsUrl: 'https://developers.google.com/drive/api/v3/about-sdk',
  },
  {
    name: 'Twitter',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/twitter',
    apiKeyUrl: 'https://developer.twitter.com/en/portal/dashboard',
    docsUrl: 'https://developer.twitter.com/en/docs',
  },
  {
    name: 'Facebook',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/facebook',
    apiKeyUrl: 'https://developers.facebook.com/apps',
    docsUrl: 'https://developers.facebook.com/docs',
  },
  {
    name: 'Instagram',
    category: 'social',
    logo: 'https://cdn.simpleicons.org/instagram',
    apiKeyUrl: 'https://www.instagram.com/developer',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
  },
  {
    name: 'WhatsApp',
    category: 'communication',
    logo: 'https://cdn.simpleicons.org/whatsapp',
    apiKeyUrl: 'https://developers.facebook.com/apps',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    name: 'Netflix',
    category: 'media',
    logo: 'https://cdn.simpleicons.org/netflix',
    apiKeyUrl: 'https://developer.netflix.com',
    docsUrl: 'https://developer.netflix.com/docs',
  },
  {
    name: 'Hulu',
    category: 'media',
    logo: 'https://cdn.simpleicons.org/hulu',
    apiKeyUrl: 'https://developer.hulu.com',
    docsUrl: 'https://developer.hulu.com/docs',
  },
  {
    name: 'Feedly',
    category: 'productivity',
    logo: 'https://cdn.simpleicons.org/feedly',
    apiKeyUrl: 'https://developer.feedly.com',
    docsUrl: 'https://developer.feedly.com/docs',
  },
  {
    name: 'Google Maps',
    category: 'productivity',
    logo: 'https://cdn.simpleicons.org/googlemaps',
    apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
    docsUrl: 'https://developers.google.com/maps/documentation',
  },
  {
    name: 'YouTube',
    category: 'media',
    logo: 'https://cdn.simpleicons.org/youtube',
    apiKeyUrl: 'https://console.cloud.google.com/apis/credentials',
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
];

const CATEGORIES = {
  communication: 'Communication',
  productivity: 'Productivity',
  social: 'Social Media',
  development: 'Development',
  storage: 'Storage',
  media: 'Media',
  database: 'Database',
} as const;

export function IntegrationsPanel() {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const { integrations, connectIntegration, disconnectIntegration } = useIntegrationsStore();

  const handleDisconnect = async (type: string) => {
    try {
      await disconnectIntegration(type.toLowerCase());
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Always render clipboard monitor for API key detection */}
      <ClipboardMonitor />

      {/* Integration categories */}
      {Object.entries(CATEGORIES).map(([category, label]) => {
        const categoryIntegrations = INTEGRATIONS.filter(i => i.category === category);
        if (categoryIntegrations.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryIntegrations.map(integration => {
                const isConnected = integrations.some(i => 
                  i.type.toLowerCase() === integration.name.toLowerCase()
                );

                return (
                  <div
                    key={integration.name}
                    className={`relative rounded-lg border bg-white p-4 transition-all hover:shadow-md cursor-pointer
                      ${selectedIntegration?.name === integration.name ? 'ring-2 ring-blue-500' : ''}
                      ${isConnected ? 'border-green-200' : 'border-gray-200'}`}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={integration.logo}
                        alt={integration.name}
                        className="h-12 w-12 object-contain"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {integration.name}
                      </span>
                      {isConnected && (
                        <span className="absolute top-2 right-2 text-green-500">
                          <Lock className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Integration details */}
      {selectedIntegration && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={selectedIntegration.logo}
                alt={selectedIntegration.name}
                className="h-16 w-16 object-contain"
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedIntegration.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {CATEGORIES[selectedIntegration.category]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={selectedIntegration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Documentation
                <ExternalLink className="h-4 w-4" />
              </a>
              {integrations.some(i => 
                i.type.toLowerCase() === selectedIntegration.name.toLowerCase()
              ) ? (
                <button
                  onClick={() => handleDisconnect(selectedIntegration.name)}
                  className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Disconnect
                </button>
              ) : (
                <a
                  href={selectedIntegration.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                >
                  Get API Key
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}