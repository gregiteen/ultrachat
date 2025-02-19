/**
 * Model Context Protocol (MCP) client implementation
 * 
 * This implements the MCP client-server protocol for connecting LLMs to external data and tools.
 * Uses SSE (Server-Sent Events) transport for remote communication in cloud environment.
 */

interface MCPToolRequest<T extends Record<string, any> = Record<string, any>> {
  jsonrpc: '2.0';
  method: string;
  params: T;
  id?: string | number;
}

interface MCPResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

interface MCPServerCapabilities {
  tools: Record<string, {
    description: string;
    inputSchema: Record<string, any>;
  }>;
}

class MCPClient {
  private static instance: MCPClient;
  private eventSource?: EventSource;
  private initialized = false;
  private capabilities?: MCPServerCapabilities;
  private messageHandlers = new Map<string | number, (response: MCPResponse) => void>();
  private requestId = 0;

  private constructor() {}

  public static getInstance(): MCPClient {
    if (!MCPClient.instance) {
      MCPClient.instance = new MCPClient();
    }
    return MCPClient.instance;
  }

  /**
   * Initialize connection to MCP server
   */
  private async init() {
    if (this.initialized) return;

    try {
      console.log('MCP - Starting server connection');

      // Create SSE connection
      this.eventSource = new EventSource('/api/mcp/events');

      // Handle server messages
      this.eventSource.onmessage = (event) => {
        try {
          const response: MCPResponse = JSON.parse(event.data);
          this.handleServerMessage(response);
        } catch (error) {
          console.error('MCP - Error parsing server message:', error);
        }
      };

      // Handle connection errors
      this.eventSource.onerror = (error) => {
        console.error('MCP - Server connection error:', error);
        this.cleanup();
      };

      // Initialize server with capabilities request
      const response = await this.sendRequest<MCPServerCapabilities>({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {}
      });

      this.capabilities = response;
      this.initialized = true;
      console.log('MCP - Server initialized with capabilities:', this.capabilities);

    } catch (error) {
      console.error('MCP - Initialization failed:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Send request to MCP server
   */
  private async sendRequest<TResponse = any, TParams extends Record<string, any> = Record<string, any>>(
    request: MCPToolRequest<TParams>
  ): Promise<TResponse> {
    const id = this.requestId++;
    const requestWithId = { ...request, id };

    return new Promise((resolve, reject) => {
      // Set up response handler
      this.messageHandlers.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result as TResponse);
        }
        this.messageHandlers.delete(id);
      });

      // Send request
      fetch('/api/mcp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestWithId)
      }).catch(reject);
    });
  }

  /**
   * Handle incoming server message
   */
  private handleServerMessage(response: MCPResponse) {
    if (response.id !== undefined) {
      const handler = this.messageHandlers.get(response.id);
      if (handler) {
        handler(response);
      }
    }
  }

  /**
   * Clean up resources
   */
  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.initialized = false;
    this.capabilities = undefined;
    this.messageHandlers.clear();
  }

  /**
   * Execute an MCP tool
   */
  public async executeTool<TResponse = any, TParams extends Record<string, any> = Record<string, any>>(
    request: Omit<MCPToolRequest<TParams>, 'jsonrpc'>
  ): Promise<TResponse> {
    if (!this.initialized) {
      await this.init();
    }

    return this.sendRequest<TResponse, TParams>({
      jsonrpc: '2.0',
      ...request
    });
  }
}

// Export singleton instance
const mcpClient = MCPClient.getInstance();

/**
 * Execute an MCP tool with type safety
 */
export async function use_mcp_tool<TResponse = any, TParams extends Record<string, any> = Record<string, any>>(
  request: {
    server_name: string;
    tool_name: string;
    arguments: TParams;
  }
): Promise<TResponse> {
  return mcpClient.executeTool<TResponse, TParams>({
    method: `${request.server_name}.${request.tool_name}`,
    params: request.arguments
  });
}

/**
 * Access an MCP resource
 */
export async function access_mcp_resource<T = any>(
  server_name: string,
  uri: string
): Promise<T> {
  return mcpClient.executeTool<T>({
    method: `${server_name}.access_resource`,
    params: { uri }
  });
}

/**
 * List registered MCP servers
 */
export async function list_mcp_servers(): Promise<Array<{
  name: string;
  status: 'running' | 'stopped' | 'error';
  capabilities: string[];
}>> {
  return mcpClient.executeTool({
    method: 'system.list_servers',
    params: {}
  });
}
