#!/usr/bin/env node
import { spawn } from "child_process";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

interface ToolCallResult {
  content: Array<{ type: string; text: string }>;
}

async function main() {
  // MCPサーバーのプロセスを起動
  const serverProcess = spawn("node", ["../mcp-server/dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // エラー出力をログに表示
  serverProcess.stderr.on("data", (data) => {
    console.error(`[Server]: ${data.toString()}`);
  });

  // クライアントトランスポートの作成
  const transport = new StdioClientTransport({
    command: "node",
    args: ["../mcp-server/dist/index.js"],
  });

  // MCPクライアントの作成
  const client = new Client(
    {
      name: "hello-world-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    // サーバーに接続
    await client.connect(transport);
    console.log("Connected to MCP server");

    // 利用可能なツールのリストを取得
    const toolsResponse = await client.listTools();
    console.log("Available tools:", toolsResponse);

    // Hello Worldツールを呼び出し（名前なし）
    console.log("\nCalling hello tool without name:");
    const helloResponse1 = await client.callTool({
      name: "hello",
      arguments: {},
    });
    console.log("Response:", (helloResponse1 as ToolCallResult).content[0].text);

    // Hello Worldツールを呼び出し（名前あり）
    console.log("\nCalling hello tool with name:");
    const helloResponse2 = await client.callTool({
      name: "hello",
      arguments: {
        name: "MCP User",
      },
    });
    console.log("Response:", (helloResponse2 as ToolCallResult).content[0].text);

    // 接続を閉じる
    await client.close();
    console.log("\nDisconnected from MCP server");

    // サーバープロセスを終了
    serverProcess.kill();
  } catch (error) {
    console.error("Client error:", error);
    serverProcess.kill();
    process.exit(1);
  }
}

main();
