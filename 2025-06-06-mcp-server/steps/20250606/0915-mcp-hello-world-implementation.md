# MCP Hello World サーバー・クライアント実装

## ユーザーからの指示

- TypeScript製のMCPサーバーの簡単な実装を確認したい
- Hello Worldを返すだけの最も単純なMCPサーバーとクライアントを作成
- pnpmで適切なプロジェクト・パッケージング設定
- サーバーとクライアントの動作確認
- READMEに詳しい利用法を記載（pnpmに統一）

## 実装内容

### 1. プロジェクト構成

- pnpm workspaceを使用したモノレポ構成
- `mcp-server/`: MCPサーバーの実装
- `mcp-client/`: MCPクライアントの実装

### 2. MCPサーバー実装

```typescript
// mcp-server/src/index.ts
- @modelcontextprotocol/sdk を使用
- Server クラスでMCPサーバーを作成
- ListToolsRequestSchema と CallToolRequestSchema を使用してハンドラー登録
- "hello"ツールを実装（オプションのname引数を受け取る）
- StdioServerTransport で標準入出力経由の通信
```

### 3. MCPクライアント実装

```typescript
// mcp-client/src/index.ts
- Client クラスでMCPクライアントを作成
- StdioClientTransport でサーバーと通信
- listTools() で利用可能なツールを取得
- callTool() でツールを実行
- サーバープロセスの自動起動と終了処理
```

### 4. 主な課題と解決

1. **MCP SDK のバージョン問題**
   - 最初は存在しないバージョン2.0.0を指定していた
   - 最新版の1.12.1に修正

2. **API の変更対応**
   - setRequestHandler にスキーマオブジェクトを渡す必要があった
   - client.request() から高レベルAPI（listTools, callTool）に変更

3. **TypeScript の型エラー**
   - callTool の戻り値の型を適切に扱うため、インターフェースを定義

4. **package.json のinstallスクリプト**
   - 無限ループを引き起こしていたため削除

### 5. 動作確認結果

```txt
Connected to MCP server
Available tools: { tools: [{ name: 'hello', ... }] }

Calling hello tool without name:
Response: Hello, World!

Calling hello tool with name:
Response: Hello, MCP User!

Disconnected from MCP server
```

## 成果物

- 完全に動作するMCPサーバーとクライアントのサンプル実装
- pnpm workspaceによる効率的なモノレポ管理
- 詳細なREADMEドキュメント（セットアップから実行、トラブルシューティングまで）
- TypeScriptによる型安全な実装

## 今後の拡張可能性

- 新しいツールの追加
- より複雑なパラメータ処理
- エラーハンドリングの改善
- 実際のアプリケーションとの統合
- テストの追加
