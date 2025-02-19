import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../base/Dialog';
import { AlertCircle, ExternalLink, Key, Loader2, Puzzle, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Integration, IntegrationMetadata } from '../../types/integration';
import { useKeychainStore } from '../../store/keychainStore';
import { useToastStore } from '../../store/toastStore';
import { integrationHealth, type HealthCheckResult } from '../../lib/integration-health';

interface IntegrationCardProps {
  type: Integration['type'];
  metadata: IntegrationMetadata;
  isConnected: boolean;
  onConnect: (type: Integration['type'], config?: { apiKey?: string }) => Promise<void>;
  onDisconnect: (type: Integration['type']) => Promise<void>;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  type,
  metadata,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [iconError, setIconError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const { addKey } = useKeychainStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    if (isConnected) {
      // Start monitoring when connected
      const checkHealth = async () => {
        const integration = {
          id: `${type}_${metadata.name}`,
          type,
          status: 'connected',
          settings: metadata.authType === 'apiKey' ? { api_key: await getKeyForService(type) } : undefined,
          last_synced: new Date().toISOString()
        };
        await integrationHealth.startMonitoring(integration);
        setHealth(integrationHealth.getHealth(integration.id));
      };
      checkHealth();

      return () => {
        // Stop monitoring when disconnected
        integrationHealth.stopMonitoring(`${type}_${metadata.name}`);
      };
    }
  }, [isConnected, type, metadata]);

  const handleConnect = async () => {
    if (metadata.authType === 'oauth') {
      await onConnect(type);
    } else {
      setShowDialog(true);
    }
  };

  const handleSubmitKey = async () => {
    if (!apiKey.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Save to keychain
      await addKey({
        name: `${metadata.name} API Key`,
        service: type,
        key: apiKey
      });

      // Connect integration
      await onConnect(type, { apiKey });
      
      setShowDialog(false);
      showToast({
        message: `Successfully connected ${metadata.name}`,
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration');
      showToast({
        message: err instanceof Error ? err.message : 'Failed to connect integration',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setApiKey('');
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border p-4 space-y-4 hover:shadow-md transition-shadow relative ${health?.status === 'error' ? 'border-red-300' : health?.status === 'degraded' ? 'border-yellow-300' : isConnected ? 'border-green-300' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg">
            {iconError ? (
              <Puzzle className="w-8 h-8 text-gray-400" />
            ) : (
              <img
                src={metadata.logo.url}
                alt={metadata.logo.alt}
                width={metadata.logo.width}
                height={metadata.logo.height}
                className="max-w-full max-h-full object-contain p-1"
                onError={() => setIconError(true)}
                style={{
                  filter: metadata.category === 'Custom' ? 'grayscale(100%)' : 'none',
                  opacity: metadata.category === 'Custom' ? 0.7 : 1
                }}
              />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{metadata.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{metadata.category}</p>
              {isConnected && health && (
                <div className="flex items-center gap-1">
                  {health.status === 'healthy' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : health.status === 'degraded' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {health.status === 'healthy' 
                      ? 'Healthy' 
                      : health.status === 'degraded'
                      ? 'Degraded'
                      : 'Error'}
                  </span>
                  {health.details?.errorCount && health.details.errorCount > 0 && (
                    <span className="text-xs text-gray-400">
                      (Retry {health.details.errorCount}/3)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {metadata.docsUrl && (
            <a
              href={metadata.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
              title="View Documentation"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        <p className="text-sm text-gray-600">{metadata.description}</p>

        <div className="flex flex-wrap gap-2">
          {metadata.capabilities.map((capability) => (
            <span
              key={capability}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
            >
              {capability}
            </span>
          ))}
        </div>

        {health?.issues.length > 0 && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
            <div className="font-medium mb-1">Issues:</div>
            <ul className="list-disc list-inside space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={isConnected ? () => onDisconnect(type) : handleConnect}
          disabled={loading}
          className={`
            w-full px-4 py-2 rounded-lg font-medium
            ${isConnected
              ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-200'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-200'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors focus:outline-none focus:ring-2
          `}
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : health?.status === 'degraded' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : null}
            {loading ? 'Processing...' : isConnected ? 'Disconnect' : 'Connect'}
          </span>
        </button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {metadata.name}</DialogTitle>
            <DialogDescription>
              Enter your API key to connect {metadata.name}. 
              {metadata.apiKeyUrl && (
                <span>
                  {' '}You can find your API key in the{' '}
                  <a 
                    href={metadata.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {metadata.name} dashboard
                  </a>
                  .
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={metadata.apiKeyPlaceholder || 'Enter your API key'}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {metadata.apiKeyInstructions && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                {metadata.apiKeyInstructions}
              </div>
            )}

            <div className="h-4" /> {/* Spacer */}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitKey}
              disabled={loading || !apiKey.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};