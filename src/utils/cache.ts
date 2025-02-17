export class Cache {
  private store: Map<string, any>;
  private ttls: Map<string, number>;
  private maxSize: number;

  constructor(config: { ttl: number; maxSize: number }) {
    this.store = new Map();
    this.ttls = new Map();
    this.maxSize = config.maxSize;
  }

  async get(key: string): Promise<any> {
    const value = this.store.get(key);
    const expiry = this.ttls.get(key);

    if (value === undefined) {
      return null;
    }

    if (expiry && Date.now() > expiry) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }

    return value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, value);
    
    if (ttl) {
      this.ttls.set(key, Date.now() + ttl);
    }

    // Enforce size limit
    while (this.store.size > this.maxSize) {
      const [oldestKey] = this.store.keys();
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.ttls.delete(oldestKey);
      }
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.ttls.clear();
  }
}