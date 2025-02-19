import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-service';
import { useKeychainStore } from '../../store/keychainStore';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function KeychainManager() {
  const { user } = useAuth();
  const { keys, loading, error, fetchKeys, addKey, deleteKey } = useKeychainStore();
  const [newKey, setNewKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user, fetchKeys]);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newKeyName) return;

    try {
      await addKey({
        name: newKeyName,
        key: newKey,
        service: newKeyName.toLowerCase().replace(/\s+/g, '_'),
        encryptedKey: [],
        iv: [],
        salt: []
      });
      setNewKey('');
      setNewKeyName('');
    } catch (error) {
      console.error('Failed to add key:', error);
    }
  };

  const handleCopyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy key:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Manage your API keys for various services
        </p>
      </div>

      {/* Add New Key Form */}
      <form onSubmit={handleAddKey} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="key-name" className="block text-sm font-medium mb-1">
              Key Name
            </label>
            <input
              id="key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="OpenAI API Key"
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>
          <div>
            <label htmlFor="key-value" className="block text-sm font-medium mb-1">
              Key Value
            </label>
            <input
              id="key-value"
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Key
        </button>
      </form>

      {/* Keys List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {showKey[key.id] ? key.key : '•'.repeat(20)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyKey(key.key, key.id)}
                  className="p-2 hover:bg-accent rounded-md"
                  title="Copy key"
                >
                  {copied[key.id] ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                  className="p-2 hover:bg-accent rounded-md"
                  title={showKey[key.id] ? 'Hide key' : 'Show key'}
                >
                  {showKey[key.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="p-2 hover:bg-accent rounded-md text-destructive"
                  title="Delete key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}