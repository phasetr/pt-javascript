# MCP Hello World サンプル

TypeScriptで実装された最小限のMCP（Model Context Protocol）サーバーとクライアントの例です。

## 概要

MCPは、AIアシスタント（Claude等）とローカルツール・リソースを安全に接続するためのオープンプロトコルです。このサンプルでは、「Hello World」ツールを実装しています。

## クイックスタート

```bash
# セットアップ
git clone <repository-url>
cd mcp-hello-world
pnpm install
pnpm build

# 実行（チャットCLI）
pnpm start:chat
```

## プロジェクト構成

- **mcp-server/** - MCPサーバー（Hello Worldツールを提供）
- **mcp-client/** - テスト用スクリプトクライアント
- **mcp-chat-client/** - 対話型CLIチャットクライアント

## 使い方

### チャットクライアント（推奨）

対話的なCLIでMCPサーバーとやり取りできます。

```bash
pnpm start:chat
```

コマンド:

- `/help` - ヘルプを表示
- `/tools` - 利用可能なツール一覧
- `/hello` または `/hello <name>` - Hello Worldツールを実行
- `/exit` - 終了

### 開発時の個別起動

```bash
# ターミナル1: サーバー起動
pnpm dev:server

# ターミナル2: クライアント実行
pnpm dev:client  # またはpnpm dev:chat
```

## 詳細情報

- [実装の詳細](./docs/implementation.md) - サーバー・クライアントの実装詳細
- [トラブルシューティング](./docs/troubleshooting.md) - 問題解決ガイド
- [開発ガイド](./docs/development.md) - 拡張・カスタマイズ方法

## ライセンス

MIT
