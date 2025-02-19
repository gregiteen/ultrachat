import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';
import { KeychainEncryption } from '../lib/keychain/encryption';
import { keychainAudit } from '../lib/keychain/audit';
import { keychainCache } from '../lib/keychain/cache';
import { AuditAction, AuditSeverity } from '../lib/keychain/audit';
import type { KeyEntry, KeychainError } from '../lib/keychain/types';

interface KeychainState {
  keys: KeyEntry[];
  loading: boolean;
  error: string | null;
  fetchKeys: () => Promise<void>;
  addKey: (key: Omit<KeyEntry, 'id' | 'createdAt' | 'userId' | 'encrypted' | 'version'>) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  getKeyForService: (service: string) => Promise<string | null>;
  rotateKey: (id: string) => Promise<void>;
}

export const useKeychainStore = create<KeychainState>((set, get) => ({
  keys: [],
  loading: false,
  error: null,

  fetchKeys: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('keychain')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Process and cache keys
      const processedKeys = await Promise.all(data.map(async (key) => {
        try {
          // Cache the key for future use
          await keychainCache.cacheKey(key as KeyEntry, user.id);
          return key as KeyEntry;
        } catch (err) {
          console.error('Failed to process key:', err);
          return key as KeyEntry;
        }
      }));

      set({ keys: processedKeys });
      await keychainAudit.log(
        AuditAction.KEY_ACCESSED,
        AuditSeverity.INFO,
        user.id,
        { metadata: { keyCount: processedKeys.length } }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch keys';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addKey: async (keyData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Encrypt the key
      const encryptedData = await KeychainEncryption.encrypt(keyData.key, user.id);

      const { data, error } = await supabase
        .from('keychain')
        .insert({
          user_id: user.id,
          name: keyData.name,
          service: keyData.service,
          encrypted: true,
          version: encryptedData.version,
          iv: Array.from(encryptedData.iv),
          salt: Array.from(encryptedData.salt),
          encryptedKey: Array.from(encryptedData.encrypted)
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state and cache
      const newKey: KeyEntry = {
        id: data.id,
        name: data.name,
        key: keyData.key, // Original unencrypted key
        service: data.service,
        createdAt: new Date(data.created_at),
        userId: user.id,
        encrypted: true,
        version: encryptedData.version,
        encryptedKey: Array.from(encryptedData.encrypted),
        iv: Array.from(encryptedData.iv),
        salt: Array.from(encryptedData.salt)
      };

      await keychainCache.cacheKey(newKey, user.id);
      set(state => ({ keys: [...state.keys, newKey] }));

      await keychainAudit.logKeyCreated(user.id, data.id, data.service);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add key';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteKey: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const key = get().keys.find(k => k.id === id);
      if (!key) throw new Error('Key not found');

      const { error } = await supabase
        .from('keychain')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from cache and local state
      keychainCache.removeFromCache(key.service, user.id);
      set(state => ({
        keys: state.keys.filter(k => k.id !== id)
      }));

      await keychainAudit.logKeyDeleted(user.id, id, key.service);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete key';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getKeyForService: async (service: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try to get from cache first
      const key = await keychainCache.getKey(
        service,
        user.id,
        async () => {
          const found = get().keys.find(k => k.service === service);
          return found || null;
        }
      );

      if (!key) {
        await keychainAudit.log(
          AuditAction.KEY_NOT_FOUND,
          AuditSeverity.WARNING,
          user.id,
          { service }
        );
      }

      return key ? key.key : null;
    } catch (error) {
      console.error('Error getting key for service:', error);
      return null;
    }
  },

  rotateKey: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const key = get().keys.find(k => k.id === id);
      if (!key) throw new Error('Key not found');

      if (!key.encrypted || !key.encryptedKey || !key.iv || !key.salt) {
        throw new Error('Invalid key data for rotation');
      }

      // Rotate the key
      const rotatedData = await KeychainEncryption.rotateKey(
        new Uint8Array(key.encryptedKey),
        new Uint8Array(key.iv),
        new Uint8Array(key.salt),
        user.id,
        key.version || 1 // Default to version 1 if undefined
      );

      // Update in database
      const { data, error } = await supabase
        .from('keychain')
        .update({
          encrypted: true,
          version: rotatedData.version,
          iv: Array.from(rotatedData.iv),
          salt: Array.from(rotatedData.salt),
          encryptedKey: Array.from(rotatedData.encrypted)
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedKey: KeyEntry = {
        ...key,
        version: rotatedData.version,
        encryptedKey: Array.from(rotatedData.encrypted),
        iv: Array.from(rotatedData.iv),
        salt: Array.from(rotatedData.salt)
      };

      set(state => ({
        keys: state.keys.map(k => k.id === id ? updatedKey : k)
      }));

      // Update cache
      await keychainCache.cacheKey(updatedKey, user.id);

      await keychainAudit.logKeyRotated(user.id, id, key.service);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rotate key';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));