#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// MCPサーバーの作成
const server = new Server(
  {
    name: "hello-world-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},  // ツール機能を有効化
    },
  }
);

// Hello Worldを返すツールの登録
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello",
        description: "Returns a Hello World message",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name to greet (optional)",
            },
          },
        },
      },
    ],
  };
});

// ツールの実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "hello") {
    const personName = args?.name as string || "World";
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${personName}!`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// サーバーの起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hello World MCP server running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
