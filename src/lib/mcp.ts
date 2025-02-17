/**
 * Model Context Protocol (MCP) client utilities
 */

interface MCPToolRequest<T = Record<string, any>> {
  server_name: string;
  tool_name: string;
  arguments: T;
}

/**
 * Execute an MCP tool with type safety
 */
export async function use_mcp_tool<TResponse = any, TArgs = Record<string, any>>(
  request: MCPToolRequest<TArgs>
): Promise<TResponse> {
  try {
    // In a real implementation, this would communicate with the MCP server
    // For now, we'll just simulate the request
    const response = await fetch(`/api/mcp/${request.server_name}/${request.tool_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.arguments)
    });

    if (!response.ok) {
      throw new Error(`MCP tool execution failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('MCP tool execution error:', error);
    throw error;
  }
}

/**
 * Access an MCP resource
 */
export async function access_mcp_resource<T = any>(
  server_name: string,
  uri: string
): Promise<T> {
  try {
    const response = await fetch(`/api/mcp/${server_name}/resource?uri=${encodeURIComponent(uri)}`);

    if (!response.ok) {
      throw new Error(`MCP resource access failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('MCP resource access error:', error);
    throw error;
  }
}

/**
 * Register an MCP server
 */
export async function register_mcp_server(
  name: string,
  config: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }
): Promise<void> {
  try {
    const response = await fetch('/api/mcp/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        ...config
      })
    });

    if (!response.ok) {
      throw new Error(`MCP server registration failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('MCP server registration error:', error);
    throw error;
  }
}

/**
 * List registered MCP servers
 */
export async function list_mcp_servers(): Promise<Array<{
  name: string;
  status: 'running' | 'stopped' | 'error';
  capabilities: string[];
}>> {
  try {
    const response = await fetch('/api/mcp/servers');

    if (!response.ok) {
      throw new Error(`Failed to list MCP servers: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    throw error;
  }
}