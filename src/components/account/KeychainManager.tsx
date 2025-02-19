import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useKeychainStore } from '../../store/keychainStore';
import { useToastStore } from '../../store/toastStore';

type NewKeyData = { 
  name: string; 
  key: string; 
  service: string; 
  encryptedKey?: number[]; 
  iv?: number[]; 
  salt?: number[]; 
};

export default function KeychainManager() {
  const { user } = useAuthStore();
  const { keys, loading, error, fetchKeys, addKey, deleteKey } = useKeychainStore();
  const { showToast } = useToastStore();
  
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyData>({ name: '', key: '', service: '' });
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user, fetchKeys]);

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.key || !newKey.service) return;

    try {
      // Try to save to browser's password manager
      if ('credentials' in navigator) {
        const passwordData: PasswordCredentialData = {
          id: newKey.service,
          name: newKey.name,
          password: newKey.key,
        };

        try {
          await navigator.credentials.create({
            password: passwordData
          });
        } catch (err) {
          console.warn('Failed to save to password manager:', err);
          // Continue even if password manager fails
        }
      }

      await addKey({
        name: newKey.name,
        key: newKey.key,
        service: newKey.service,
        encryptedKey: [],
        iv: [],
        salt: []
      });
      
      showToast({
        message: 'Key added successfully',
        type: 'success'
      });
      setNewKey({ name: '', key: '', service: '' });
      setShowNewKeyForm(false);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to add key',
        type: 'error'
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      // Try to remove from browser's password manager
      const key = keys.find(k => k.id === id);
      if (key && 'credentials' in navigator) {
        try {
          await navigator.credentials.preventSilentAccess();
          // Note: There's no direct way to delete credentials,
          // but preventing silent access helps
        } catch (err) {
          console.warn('Failed to update password manager:', err);
        }
      }

      await deleteKey(id);
      showToast({
        message: 'Key deleted successfully',
        type: 'success'
      });
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to delete key',
        type: 'error'
      });
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const suggestFromPasswordManager = async () => {
    if ('credentials' in navigator) {
      const cred = await navigator.credentials.get({ 
        password: true,
        mediation: 'optional'
      });
      if (cred && cred.type === 'password') {
        const pwCred = cred as PasswordCredential;
        setNewKey({ 
          name: pwCred.name || '', 
          key: pwCred.password, 
          service: pwCred.id 
        });
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-muted-foreground">
          Please log in to manage your keychain.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium mb-2">API Keys & Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Securely store and manage your API keys and credentials.
          </p>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Key
        </button>
      </div>

      {showNewKeyForm && (
        <div className="p-4 border border-muted rounded-lg space-y-4">
          <h4 className="text-sm font-medium mb-4">Add New Key</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                placeholder="OpenAI API Key"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Service
              </label>
              <input
                type="text"
                value={newKey.service}
                onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
                className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                placeholder="OpenAI"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Key
              </label>
              <input
                type="password"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                placeholder="sk-..."
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowNewKeyForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={suggestFromPasswordManager}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Use saved password"
            >
              Suggest
            </button>
            <button
              onClick={handleAddKey}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-lg">
          <Key className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No keys yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Add your API keys and credentials to use them across the application.
          </p>
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 border border-muted rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{key.name}</div>
                <div className="text-sm text-muted-foreground">{key.service}</div>
                <div className="flex items-center gap-2">
                  <input
                    type={visibleKeys.includes(key.id) ? 'text' : 'password'}
                    value={key.key}
                    readOnly
                    className="bg-transparent border-none text-sm font-mono p-0 focus:outline-none"
                  />
                  <button
                    onClick={() => toggleKeyVisibility(key.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {visibleKeys.includes(key.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(key.key, key.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedKey === key.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}