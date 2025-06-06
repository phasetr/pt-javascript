# 開発ガイド

## 新しいツールの追加

### 1. サーバー側の実装

`mcp-server/src/index.ts`に新しいツールを追加：

```typescript
// ツールの定義を追加
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello",
        description: "Returns a Hello World message",
        inputSchema: { /* ... */ }
      },
      // 新しいツールを追加
      {
        name: "goodbye",
        description: "Returns a goodbye message",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name to say goodbye to"
            }
          }
        }
      }
    ],
  };
});

// ハンドラーを追加
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "hello") {
    // 既存の処理
  } else if (name === "goodbye") {
    const personName = args?.name as string || "World";
    return {
      content: [
        {
          type: "text",
          text: `Goodbye, ${personName}!`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});
```

### 2. チャットクライアントでのコマンド追加

`mcp-chat-client/src/index.ts`にコマンドを追加：

```typescript
if (answer.toLowerCase().startsWith('/goodbye ')) {
  const name = answer.split(' ').slice(1).join(' ').trim();
  
  const result = await client.callTool({
    name: "goodbye",
    arguments: { name },
  });
  
  console.log(chalk.cyan('応答:'), result.content[0].text);
  continue;
}
```

## テストの追加

### 単体テスト

```bash
# テストフレームワークのインストール（例：Vitest）
pnpm add -D vitest @vitest/ui

# package.jsonにスクリプトを追加
"test": "vitest"
```

### 統合テスト

MCPサーバーとクライアントの統合テストを作成し、ツールの動作を確認します。

## パッケージ管理

### 新しいパッケージの追加

```bash
# ワークスペースルートから特定のパッケージに追加
pnpm add <package-name> --filter <workspace-name>

# 例：チャットクライアントに追加
pnpm add inquirer --filter hello-world-mcp-chat-client
```

## デバッグ

### VS Codeでのデバッグ設定

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/mcp-server/src/index.ts",
      "preLaunchTask": "tsc: build - mcp-server/tsconfig.json",
      "outFiles": ["${workspaceFolder}/mcp-server/dist/**/*.js"],
      "console": "integratedTerminal"
    }
  ]
}
```

## CI/CD設定

GitHub Actionsの例：

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: pnpm/action-setup@v2
      with:
        version: 8
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'pnpm'
    - run: pnpm install
    - run: pnpm build
    - run: pnpm test
```
