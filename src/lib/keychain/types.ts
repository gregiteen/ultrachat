export interface KeychainItem {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyEntry {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: Date;
  userId: string;
  encrypted: boolean;
  version?: number;
  encryptedKey?: number[];
  iv?: number[];
  salt?: number[];
  metadata?: Record<string, any>;
}

export type KeychainAuditAction = 'add' | 'get' | 'remove' | 'clear';

export type KeychainError = {
  code: string;
  message: string;
  details?: any;
};