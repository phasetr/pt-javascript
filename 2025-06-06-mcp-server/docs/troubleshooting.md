# トラブルシューティング

## ビルドエラーが発生する場合

### Node.jsバージョン確認

```bash
node --version  # v20.0.0以上が必要
```

### 依存関係の再インストール

```bash
pnpm clean
pnpm install
pnpm build
```

## サーバーに接続できない場合

### ビルド完了の確認

```bash
ls mcp-server/dist/  # index.jsが存在するか確認
```

### パスの確認

クライアントはサーバーの相対パス（`../mcp-server/dist/index.js`）を使用しています。ディレクトリ構造が変更されていないか確認してください。

## TypeScriptエラー

### 型定義の問題

MCP SDKの最新版（1.12.1）を使用していることを確認：

```bash
pnpm list @modelcontextprotocol/sdk
```

## その他の問題

### プロセスが残っている場合

```bash
# Node.jsプロセスを確認
ps aux | grep node

# 必要に応じてプロセスを終了
kill <process-id>
```
