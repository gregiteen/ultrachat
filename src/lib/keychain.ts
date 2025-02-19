import { KeychainItem } from './keychain/types';
import { encryptData } from './keychain/encryption';
import { cacheKeychain } from './keychain/cache';
import { auditAccess } from './keychain/audit';

export class KeychainService {
  private static instance: KeychainService;
  private items: Map<string, KeychainItem>;

  private constructor() {
    this.items = new Map();
  }

  static getInstance(): KeychainService {
    if (!KeychainService.instance) {
      KeychainService.instance = new KeychainService();
    }
    return KeychainService.instance;
  }

  async addItem(key: string, value: string): Promise<void> {
    const encryptedValue = await encryptData(value);
    const item: KeychainItem = {
      key,
      value: encryptedValue,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.items.set(key, item);
    await cacheKeychain(this.items);
    await auditAccess('add', key);
  }

  async getItem(key: string): Promise<string | null> {
    const item = this.items.get(key);
    if (!item) return null;
    
    await auditAccess('get', key);
    return item.value;
  }

  async removeItem(key: string): Promise<boolean> {
    const deleted = this.items.delete(key);
    if (deleted) {
      await cacheKeychain(this.items);
      await auditAccess('remove', key);
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.items.clear();
    await cacheKeychain(this.items);
    await auditAccess('clear', '*');
  }

  getSize(): number {
    return this.items.size;
  }
}