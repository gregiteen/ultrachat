import React, { useState, useEffect, ReactNode } from 'react';
import { Lock, Key, Shield, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CryptoJS from 'crypto-js';

interface Credential {
  id: string;
  service: string;
  encrypted_data: string;
  encryption_iv: string;
  last_used_at: string;
  metadata: CredentialMetadata;
}

interface CredentialMetadata {
  title?: string;
  url?: string;
  icon?: string;
  category?: CredentialCategory;
}

type CredentialCategory = 
  | 'communication'
  | 'productivity'
  | 'social'
  | 'development'
  | 'storage'
  | 'media'
  | 'database';

const CATEGORIES: Record<CredentialCategory, string> = {
  communication: 'Communication',
  productivity: 'Productivity',
  social: 'Social Media',
  development: 'Development',
  storage: 'Storage',
  media: 'Media',
  database: 'Database'
};

interface AuditLog {
  id: string;
  action: string;
  performed_at: string;
  ip_address: string;
  user_agent: string;
}

export function KeychainManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);

  // Load credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const { data, error } = await supabase
          .from('credentials')
          .select('*')
          .order('service');

        if (error) throw error;
        setCredentials(data || []);
      } catch (err) {
        setError('Failed to load credentials');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCredentials();
  }, []);

  // Load audit logs
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('credentials_audit')
          .select('*')
          .order('performed_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setAuditLogs(data || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    };

    loadAuditLogs();
  }, []);

  // Encryption/decryption functions
  const encrypt = (data: string, key: string) => {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return {
      encrypted: encrypted.toString(),
      iv: iv.toString()
    };
  };

  const decrypt = (encrypted: string, key: string, iv: string) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  };

  // Add new credential
  const addCredential = async (service: string, secret: string, metadata: CredentialMetadata) => {
    if (!masterKey) {
      setError('Master key required');
      return;
    }

    try {
      const { encrypted, iv } = encrypt(secret, masterKey);
      const { data, error } = await supabase
        .from('credentials')
        .insert([{
          service,
          encrypted_data: encrypted,
          encryption_iv: iv,
          metadata
        }])
        .select()
        .single();

      if (error) throw error;
      setCredentials([...credentials, data]);
    } catch (err) {
      setError('Failed to add credential');
      console.error(err);
    }
  };

  // Delete credential
  const deleteCredential = async (id: string) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCredentials(credentials.filter(c => c.id !== id));
      setSelectedCredential(null);
    } catch (err) {
      setError('Failed to delete credential');
      console.error(err);
    }
  };

  // Get decrypted value
  const getDecryptedValue = (credential: Credential) => {
    if (!masterKey) return null;
    return decrypt(credential.encrypted_data, masterKey, credential.encryption_iv);
  };

  return (
    <div className="space-y-6">
      {/* Master Key Setup */}
      {!masterKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-medium">Master Key Required</h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">
            Enter your master key to access credentials. This key is used to encrypt/decrypt your secrets.
          </p>
          <input
            type="password"
            className="mt-3 w-full rounded-md border px-3 py-2"
            placeholder="Enter master key"
            onChange={(e) => setMasterKey(e.target.value)}
          />
        </div>
      )}

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(CATEGORIES).map(([category, label]) => {
          const categoryCredentials = credentials.filter(
            c => c.metadata?.category === category
          );
          
          if (categoryCredentials.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-gray-900">{label}</h3>
              {categoryCredentials.map(credential => (
                <div
                  key={credential.id}
                  className={`relative rounded-lg border bg-white p-4 cursor-pointer transition-all ${
                    selectedCredential === credential.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCredential(
                    selectedCredential === credential.id ? null : credential.id
                  )}
                >
                  <div className="flex items-center gap-3">
                    {credential.metadata?.icon ? (
                      <img
                        src={credential.metadata.icon}
                        alt={credential.service}
                        className="h-8 w-8"
                      />
                    ) : (
                      <Key className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {credential.metadata?.title || credential.service}
                      </h4>
                      {credential.metadata?.url && (
                        <a
                          href={credential.metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={e => e.stopPropagation()}
                        >
                          {new URL(credential.metadata.url).hostname}
                        </a>
                      )}
                    </div>
                  </div>

                  {selectedCredential === credential.id && masterKey && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={getDecryptedValue(credential) || ''}
                          readOnly
                          className="flex-1 rounded-md border bg-gray-50 px-3 py-1.5 text-sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSecret(!showSecret);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700"
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Last used: {new Date(credential.last_used_at).toLocaleDateString()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCredential(credential.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Audit Logs */}
      <div className="mt-8">
        <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.performed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {log.user_agent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}