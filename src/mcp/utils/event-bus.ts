import type { EventBus, MCPEvent } from '../../types/mcp';

/**
 * Pattern-based event bus implementation for MCP servers
 */
export class MCPEventBus implements EventBus {
  private handlers: Map<string, Set<(event: MCPEvent) => void>>;
  private patternCache: Map<string, RegExp>;

  constructor() {
    this.handlers = new Map();
    this.patternCache = new Map();
  }

  /**
   * Publish an event to all matching subscribers
   */
  publish(event: MCPEvent): void {
    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchesPattern(event.type, pattern)) {
        handlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error(`Error in event handler for pattern ${pattern}:`, error);
          }
        });
      }
    }
  }

  /**
   * Subscribe to events matching a pattern
   * Supports wildcards: * for single segment, ** for multiple segments
   */
  subscribe(pattern: string, handler: (event: MCPEvent) => void): void {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, new Set());
    }
    this.handlers.get(pattern)!.add(handler);
  }

  /**
   * Unsubscribe all handlers for a pattern
   */
  unsubscribe(pattern: string): void {
    this.handlers.delete(pattern);
    this.patternCache.delete(pattern);
  }

  /**
   * Check if an event type matches a pattern
   */
  private matchesPattern(type: string, pattern: string): boolean {
    // Get or create regex for pattern
    let regex = this.patternCache.get(pattern);
    if (!regex) {
      regex = new RegExp(
        `^${pattern
          .replace(/\./g, '\\.')
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^.]*')}$`
      );
      this.patternCache.set(pattern, regex);
    }

    return regex.test(type);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.handlers.clear();
    this.patternCache.clear();
  }
}