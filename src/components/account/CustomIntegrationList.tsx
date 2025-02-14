import React from 'react';
import { Globe, Trash2, RefreshCw } from 'lucide-react';
import type { Integration } from '../../types';

interface CustomIntegrationListProps {
  integrations: Integration[];
  onDelete: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<void>;
}

export function CustomIntegrationList({
  integrations,
  onDelete,
  onTest
}: CustomIntegrationListProps) {
  return (
    <div className="mt-6 space-y-4">
      {integrations.map((integration) => (
        <div
          key={integration.id}
          className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Globe className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {integration.settings?.name || 'Custom Integration'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {integration.settings?.endpoint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTest(integration.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
              title="Test Connection"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(integration.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              title="Delete Integration"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}