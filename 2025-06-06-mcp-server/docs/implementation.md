# 実装の詳細

## MCPサーバー実装

### 提供するツール

- **ツール名**: `hello`
- **説明**: Hello Worldメッセージを返す
- **パラメータ**:
  - `name` (optional): 挨拶する名前（デフォルト: "World"）

### 技術詳細

- `@modelcontextprotocol/sdk`を使用
- `ListToolsRequestSchema`と`CallToolRequestSchema`でハンドラー登録
- `StdioServerTransport`で標準入出力経由の通信

## クライアント実装

### スクリプトクライアント (mcp-client)

事前定義されたテストシナリオを実行：

1. MCPサーバープロセスを起動
2. サーバーに接続
3. 利用可能なツールのリストを取得
4. `hello`ツールを呼び出し（名前なし）
5. `hello`ツールを呼び出し（名前あり）
6. 接続を閉じる

### チャットクライアント (mcp-chat-client)

対話的なCLIインターフェース：

- **chalk**: カラフルなターミナルUI
- **ora**: 処理中のスピナー表示
- **readline**: 対話的な入力処理

## 実行例

### スクリプトクライアント

```txt
Connected to MCP server
Available tools: { tools: [{ name: 'hello', ... }] }

Calling hello tool without name:
Response: Hello, World!

Calling hello tool with name:
Response: Hello, MCP User!

Disconnected from MCP server
```

### チャットクライアント

```txt
╔══════════════════════════════════════╗
║    MCP Chat Client - Hello World     ║
╚══════════════════════════════════════╝

✓ MCPサーバーに接続しました！

> /hello
✓ 実行完了
応答: Hello, World!

> /hello Alice
✓ 実行完了
応答: Hello, Alice!
```
