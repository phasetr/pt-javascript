# ローカル環境の一発起動・停止コマンド実装のトラブルシューティング

## 概要

ローカル環境（Docker ComposeのDynamoDBとhono-api）を一発で立ち上げるコマンドと落とすコマンドをルートのpackage.jsonに定義する作業を行いました。特にhono-apiをデーモン実行・デーモンを切る対応が必要でした。

## 実施した対応

### 1. 必要なパッケージのインストール

```bash
pnpm add -D concurrently pm2 -w
```

- `concurrently`: 複数のコマンドを同時に実行するためのパッケージ
- `pm2`: Node.jsアプリケーションをデーモンとして実行するためのプロセスマネージャー
- `-w`: ワークスペースのルートに依存関係を追加するオプション

### 2. package.jsonへのコマンド追加

```json
{
  "scripts": {
    // 既存のスクリプト...
    "db:start": "docker compose up -d dynamodb-local dynamodb-admin",
    "db:stop": "docker compose down",
    "api:start": "pnpm --filter db build && pnpm prepare:deploy && pm2 start --name hono-api 'pnpm --filter=hono-api dev'",
    "api:stop": "pm2 stop hono-api && pm2 delete hono-api",
    "api:logs": "pm2 logs hono-api",
    "api:status": "pm2 status hono-api",
    "local:start": "pnpm db:start && pnpm api:start",
    "local:stop": "pnpm api:stop || true && pnpm db:stop",
    "local:restart": "pnpm local:stop && pnpm local:start"
  }
}
```

## 発生した問題と解決方法

### 問題1: ポート3000が既に使用されている

`pnpm local:start`を実行した際に、以下のエラーが発生しました：

```txt
code: 'EADDRINUSE'
errno: -48
syscall: 'listen'
address: '::'
port: 3000
```

#### 解決方法

1. 実行中のプロセスを停止

    ```bash
    pnpm local:stop
    ```

2. ポート3000を使用しているプロセスを確認

    ```bash
    lsof -i :3000
    ```

3. 該当するプロセスを強制終了

    ```bash
    lsof -i :3000 | awk 'NR>1 {print $2}' | xargs -r kill -9
    ```

4. ポートが空いていることを確認

    ```bash
    lsof -i :3000
    ```

5. 再度ローカル環境を起動

    ```bash
    pnpm local:start
    ```

### 問題2: APIのログ表示中にプロセスが終了しない

`pnpm api:logs`コマンドを実行すると、ログ表示プロセスが終了せず、次のコマンドを実行できない場合がありました。

#### 問題2の解決方法

`pkill`コマンドを使用してログ表示プロセスを強制終了しました：

```bash
pkill -f "pm2 logs"
```

## 動作確認

### APIの状態確認

```bash
pnpm api:status
```

出力：

```txt
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ hono-api           │ fork     │ 0    │ online    │ 0%       │ 136.6mb  │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### APIへのアクセス確認

```bash
curl http://localhost:3000/todos
```

出力：

```txt
Unauthorized
```

認証が必要なAPIですが、サーバー自体は正常に動作していることを確認できました。

## 最終的な解決策

以下のコマンドを使用することで、ローカル環境を簡単に管理できるようになりました：

### データベース関連

- `pnpm db:start` - DynamoDBとDynamoDB Adminを起動
- `pnpm db:stop` - DynamoDBとDynamoDB Adminを停止

### API関連

- `pnpm api:start` - hono-apiをデーモンとして起動（pm2を使用）
- `pnpm api:stop` - hono-apiデーモンを停止
- `pnpm api:logs` - hono-apiのログを表示
- `pnpm api:status` - hono-apiの状態を確認

### 一括操作

- `pnpm local:start` - DynamoDBとhono-apiを一発で起動
- `pnpm local:stop` - DynamoDBとhono-apiを一発で停止
- `pnpm local:restart` - 全てを再起動

## 教訓

1. Node.jsアプリケーションをデーモンとして実行する場合、pm2のようなプロセスマネージャーを使用すると便利です。
2. ポートが既に使用されている場合は、`lsof`コマンドで使用中のプロセスを特定し、必要に応じて終了させることが重要です。
3. 複数のサービスを一括で起動・停止するコマンドを定義することで、開発効率が向上します。
4. エラーが発生した場合は、ログを確認して原因を特定し、適切な対処を行うことが重要です。
