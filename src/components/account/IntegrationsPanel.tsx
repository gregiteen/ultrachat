import React, { useState } from 'react';
import { Mail, Calendar, MessageSquare, Video, AlertCircle, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useIntegrationsStore } from '../../store/integrations';
import { CustomIntegrationForm } from './CustomIntegrationForm';
import { CustomIntegrationList } from './CustomIntegrationList';
import type { Integration } from '../../types';

const INTEGRATION_CONFIGS = {
  gmail: {
    name: 'Gmail',
    icon: Mail,
    description: 'Connect your Gmail account to send and receive emails',
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  },
  google_calendar: {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Sync and manage your calendar events',
    scopes: ['https://www.googleapis.com/auth/calendar'],
  },
  slack: {
    name: 'Slack',
    icon: MessageSquare,
    description: 'Connect with your Slack workspace',
    scopes: ['chat:write', 'channels:read'],
  },
  zoom: {
    name: 'Zoom',
    icon: Video,
    description: 'Schedule and manage Zoom meetings',
    scopes: ['meeting:write', 'user:read'],
  },
};

export function IntegrationsPanel() {
  const {
    integrations,
    connectIntegration,
    disconnectIntegration,
    addCustomIntegration,
    testCustomIntegration,
    deleteCustomIntegration
  } = useIntegrationsStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleConnect = async (type: Integration['type']) => {
    setConnecting(type);
    try {
      await connectIntegration(type);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (type: Integration['type']) => {
    try {
      await disconnectIntegration(type);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleAddCustom = async (data: { name: string; endpoint: string; apiKey: string }) => {
    await addCustomIntegration(data);
    setShowCustomForm(false);
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const customIntegrations = integrations.filter(i => i.type === 'custom');
  const standardIntegrations = integrations.filter(i => i.type !== 'custom');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <button
          onClick={() => setShowCustomForm(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Add Custom Integration
        </button>
      </div>

      {/* Standard Integrations */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(INTEGRATION_CONFIGS).map(([key, config]) => {
          const integration = standardIntegrations.find((i) => i.type === key);
          const Icon = config.icon;

          return (
            <div
              key={key}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
                {integration && getStatusIcon(integration.status)}
              </div>

              <div className="mt-4">
                {integration?.status === 'connected' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Last synced:{' '}
                      {integration.last_synced
                        ? new Date(integration.last_synced).toLocaleDateString()
                        : 'Never'}
                    </span>
                    <button
                      onClick={() => handleDisconnect(integration.type)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(key as Integration['type'])}
                    disabled={connecting === key}
                    className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {connecting === key ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Integrations */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Custom Integrations</h3>
        <CustomIntegrationList
          integrations={customIntegrations}
          onDelete={deleteCustomIntegration}
          onTest={testCustomIntegration}
        />
      </div>

      {/* Custom Integration Form */}
      {showCustomForm && (
        <CustomIntegrationForm
          onSubmit={handleAddCustom}
          onClose={() => setShowCustomForm(false)}
        />
      )}
    </div>
  );
}