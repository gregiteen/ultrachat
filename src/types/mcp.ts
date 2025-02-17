/**
 * Model Context Protocol (MCP) Types
 */

export interface MCPConfig {
  rateLimit: {
    requests: number;
    period: number;
  };
}

export interface MCPAction {
  name: string;
  parameters: Record<string, any>;
}

export interface MCPEvent {
  type: string;
  source: string;
  timestamp: string;
  data: any;
}

export abstract class BaseMCPServer {
  abstract readonly capabilities: string[];
  abstract readonly tools: Record<string, (...args: any[]) => Promise<any>>;
  abstract destroy(): Promise<void>;
}

export interface EventBus {
  publish(event: MCPEvent): void;
  subscribe(pattern: string, handler: (event: MCPEvent) => void): void;
  unsubscribe(pattern: string): void;
}

export interface MCPToolRequest<T = Record<string, any>> {
  server_name: string;
  tool_name: string;
  arguments: T;
}

export interface MCPResourceRequest {
  server_name: string;
  uri: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPServerInfo {
  name: string;
  status: 'running' | 'stopped' | 'error';
  capabilities: string[];
}

export interface MCPServerRegistry {
  register(name: string, config: MCPServerConfig): Promise<void>;
  unregister(name: string): Promise<void>;
  list(): Promise<MCPServerInfo[]>;
  get(name: string): Promise<MCPServerInfo>;
}

export interface MCPClient {
  executeTool<TResponse = any, TArgs = Record<string, any>>(
    request: MCPToolRequest<TArgs>
  ): Promise<TResponse>;
  
  accessResource<T = any>(request: MCPResourceRequest): Promise<T>;
  
  getServerInfo(name: string): Promise<MCPServerInfo>;
  listServers(): Promise<MCPServerInfo[]>;
}