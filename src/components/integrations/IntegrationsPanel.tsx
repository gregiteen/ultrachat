import React, { useState, type FC, type ReactNode } from 'react';
import { Plus, Settings, Loader2, AlertCircle, LayoutGrid, Activity } from 'lucide-react';
import { useIntegrationsStore } from '../../store/integrations';
import type { Integration } from '../../types/integration';
import { useKeychainStore } from '../../store/keychainStore';
import { useToastStore } from '../../store/toastStore';
import { IntegrationCard } from './IntegrationCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../base/Dialog';
import { getIntegrationMetadata, getIntegrationsByCategory, getCategories } from '../../lib/integration-metadata';
import { Button } from '../base/Button';
import { HealthDashboard } from './HealthDashboard';

export const IntegrationsPanel: FC = (): ReactNode => {
  const { 
    integrations, 
    loading, 
    error, 
    connectIntegration, 
    disconnectIntegration,
    addCustomIntegration 
  } = useIntegrationsStore();
  
  const { addKey, deleteKey, getKeyForService } = useKeychainStore();
  const { showToast } = useToastStore();
  const [view, setView] = useState<'grid' | 'health'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom integration form state
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customIntegration, setCustomIntegration] = useState({
    name: '',
    description: '',
    endpoint: '',
    apiKey: ''
  });

  const handleConnect = async (type: Integration['type']) => {
    try {
      const meta = getIntegrationMetadata(type);
      if (meta.authType === 'apiKey') {
        // For API key auth, save to keychain
        const key = await getKeyForService(type);
        if (key) {
          await connectIntegration(type, { apiKey: key });
        } else {
          // Show key input dialog
          const apiKey = window.prompt(`Please enter your ${meta.name} API key:`);
          if (!apiKey) return;

          // Save to keychain
          await addKey({
            name: `${meta.name} API Key`,
            service: type,
            key: apiKey
          });
          await connectIntegration(type, { apiKey });
        }
      } else {
        // For OAuth, just connect directly
        await connectIntegration(type);
      }
      showToast({
        message: `Successfully connected ${meta.name}`,
        type: 'success' as const
      });
    } catch (err) {
      showToast({
        message: `Failed to connect ${getIntegrationMetadata(type).name}`,
        type: 'error' as const
      });
    }
  };

  const handleDisconnect = async (type: Integration['type']) => {
    try {
      const meta = getIntegrationMetadata(type);
      if (meta.authType === 'apiKey') {
        // Remove from keychain
        const integration = integrations.find(i => i.type === type);
        if (integration) await deleteKey(integration.id);
      }

      await disconnectIntegration(type);
      showToast({
        message: `Successfully disconnected ${meta.name}`,
        type: 'success' as const
      });
    } catch (err) {
      showToast({
        message: `Failed to disconnect ${getIntegrationMetadata(type).name}`,
        type: 'error' as const
      });
    }
  };

  const handleAddCustomIntegration = async () => {
    try {
      // Save API key to keychain
      await addKey({
        name: `${customIntegration.name} API Key`,
        service: `custom_${customIntegration.name.toLowerCase().replace(/\s+/g, '_')}`,
        key: customIntegration.apiKey
      });

      // Add custom integration
      await addCustomIntegration({
        name: customIntegration.name,
        endpoint: customIntegration.endpoint,
        apiKey: customIntegration.apiKey
      });

      setShowCustomDialog(false);
      setCustomIntegration({
        name: '',
        description: '',
        endpoint: '',
        apiKey: ''
      });

      showToast({
        message: 'Custom integration added successfully',
        type: 'success' as const
      });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to add custom integration',
        type: 'error' as const
      });
    }
  };

  const categories = getCategories();
  const filteredIntegrations = getIntegrationsByCategory(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <span className="text-center">
            Failed to load integrations
            <br />
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Try refreshing the page
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
                view === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setView('health')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
                view === 'health' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4" /> Health
            </button>
          </div>
          {view === 'grid' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => setShowCustomDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Integration
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.open('/settings/integrations', '_blank')}
            title="Integration Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'health' ? (
        <HealthDashboard />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredIntegrations.map(([type, meta]) => {
            const isConnected = integrations.some(i => i.type === type as Integration['type']);          
            return (
              <IntegrationCard
                key={type}
                type={type as Integration['type']}
                metadata={meta}
                isConnected={isConnected}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            );
          })}
        </div>
      )}

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Integration</DialogTitle>
            <DialogDescription>
              Add your own integration by providing the necessary details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                value={customIntegration.name}
                onChange={(e) => setCustomIntegration(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Integration Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description
              </label>
              <textarea
                value={customIntegration.description}
                onChange={(e) => setCustomIntegration(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Describe your integration"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                API Endpoint
              </label>
              <input
                type="text"
                value={customIntegration.endpoint}
                onChange={(e) => setCustomIntegration(prev => ({ ...prev, endpoint: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://api.example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                API Key
              </label>
              <input
                type="password"
                value={customIntegration.apiKey}
                onChange={(e) => setCustomIntegration(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter your API key"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowCustomDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomIntegration}
              disabled={!customIntegration.name || !customIntegration.endpoint || !customIntegration.apiKey}
            >
              Add Integration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};