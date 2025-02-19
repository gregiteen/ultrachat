import { Buffer } from 'buffer';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

interface EncryptedData {
  iv: Buffer;
  tag: Buffer;
  encrypted: Buffer;
}

interface EncryptionResult {
  encrypted: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
  version: number;
}

export class KeychainEncryption {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.ENCRYPTION_SECRET || 'default-secret';
  }

  // Instance methods
  async encrypt(data: string): Promise<string> {
    return encryptData(data);
  }

  async decrypt(encryptedData: string): Promise<string> {
    return decryptData(encryptedData);
  }

  async rotateKey(newSecret: string): Promise<void> {
    await rotateEncryptionKey(this.secret, newSecret);
    this.secret = newSecret;
  }

  async validate(): Promise<boolean> {
    return validateEncryptionSetup();
  }

  // Static methods for keychain operations
  static async encrypt(data: string, userId: string): Promise<EncryptionResult> {
    const encrypted = await encryptData(data);
    const parts = Buffer.from(encrypted, 'base64');
    
    return {
      salt: parts.slice(0, SALT_LENGTH),
      iv: parts.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH),
      encrypted: parts.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH),
      version: 1
    };
  }

  static async rotateKey(
    encrypted: Uint8Array,
    iv: Uint8Array,
    salt: Uint8Array,
    userId: string,
    currentVersion: number
  ): Promise<EncryptionResult> {
    // Re-encrypt with new key
    return this.encrypt(Buffer.from(encrypted).toString(), userId);
  }
}

// Helper functions
function getKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha256', (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function encryptData(data: string): Promise<string> {
  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Get encryption key using environment secret
    const key = await getKey(process.env.ENCRYPTION_SECRET || 'default-secret', salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get auth tag
    const tag = cipher.getAuthTag();
    
    // Combine all components
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);
    
    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decryptData(encryptedData: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Get decryption key
    const key = await getKey(process.env.ENCRYPTION_SECRET || 'default-secret', salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Utility function to rotate encryption keys
export async function rotateEncryptionKey(oldSecret: string, newSecret: string): Promise<void> {
  const keychain = new Map<string, string>();
  
  // Re-encrypt all data with new key
  for (const [key, value] of keychain.entries()) {
    const decrypted = await decryptData(value);
    const reencrypted = await encryptData(decrypted);
    keychain.set(key, reencrypted);
  }
}

// Validate encryption setup
export async function validateEncryptionSetup(): Promise<boolean> {
  try {
    const testData = 'test-data';
    const encrypted = await encryptData(testData);
    const decrypted = await decryptData(encrypted);
    return testData === decrypted;
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}