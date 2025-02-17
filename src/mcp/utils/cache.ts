interface CacheConfig {
  ttl: number;      // Time to live in milliseconds
  maxSize: number;  // Maximum cache size in bytes
}

interface CacheEntry {
  value: any;
  size: number;
  expires: number;
  lastAccessed: number;
}

/**
 * Memory cache with TTL and size limits
 * Uses LRU (Least Recently Used) eviction policy
 */
export class Cache {
  private store: Map<string, CacheEntry>;
  private currentSize: number;
  private readonly config: CacheConfig;

  constructor(config: CacheConfig) {
    this.store = new Map();
    this.currentSize = 0;
    this.config = config;
  }

  /**
   * Get item from cache
   */
  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    this.store.set(key, entry);
    
    return entry.value;
  }

  /**
   * Set item in cache
   */
  async set(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    const size = new TextEncoder().encode(serialized).length;

    // If single item is larger than max size, don't cache
    if (size > this.config.maxSize) {
      console.warn(`Cache item larger than max size: ${key}`);
      return;
    }

    // Make space if needed
    while (this.currentSize + size > this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      value,
      size,
      expires: Date.now() + this.config.ttl,
      lastAccessed: Date.now()
    };

    this.store.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      this.store.delete(key);
      this.currentSize -= entry.size;
    }
  }

  /**
   * Clear all items from cache
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache stats
   */
  getStats(): {
    itemCount: number;
    currentSize: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      itemCount: this.store.size,
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      utilization: this.currentSize / this.config.maxSize
    };
  }

  /**
   * Evict least recently used items
   */
  private evictLRU(): void {
    let oldest: { key: string; time: number } | null = null;

    for (const [key, entry] of this.store.entries()) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }

    if (oldest) {
      const entry = this.store.get(oldest.key);
      if (entry) {
        this.store.delete(oldest.key);
        this.currentSize -= entry.size;
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        this.store.delete(key);
        this.currentSize -= entry.size;
      }
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanup(interval: number = 60000): NodeJS.Timer {
    return setInterval(() => this.cleanup(), interval);
  }
}