import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NextstepApiClient } from "./client.js";
import { readConfigFromEnv, type NextstepMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createNextstepMcpServer(config: NextstepMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "Nextstep",
    version: "0.1.0",
  });

  const client = new NextstepApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: NextstepMcpConfig = readConfigFromEnv()) {
  const { server } = createNextstepMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
