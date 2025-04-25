# Cloudflare React Router + D1 アプリケーション利用マニュアル

## 1. プロジェクト概要

このプロジェクトは、Cloudflare Workers上でReact Router + Hono + D1(Cloudflareのデータベース) + Drizzle ORMを使用した顧客管理アプリケーションです。顧客情報のCRUD（作成・読取・更新・削除）操作を行うシンプルなウェブアプリケーションとして実装されています。

プロジェクトは以下の2つの主要コンポーネントで構成されています：

1. **React Routerフロントエンド（packages/rr）**: ユーザーインターフェースを提供するウェブアプリケーション
2. **Hono API（packages/hono-api）**: RESTful APIを提供するバックエンドサービス

どちらのコンポーネントも同じD1データベースにアクセスし、Drizzle ORMを使用してデータを操作します。

プロジェクト略称: CRD (Cloudflare React router D1)

## 2. システム要件

- Node.js 18.x以上
- pnpm 10.x以上
- Cloudflareアカウント（本番環境へのデプロイ時に必要）
- wrangler CLI（Cloudflareのコマンドラインツール）

## 3. インストール方法

### 3.1 リポジトリのクローン

```bash
git clone <リポジトリURL>
cd <プロジェクトディレクトリ>
```

### 3.2 依存関係のインストール

```bash
pnpm install
```

## 4. 開発環境の起動方法

### 4.1 React Routerフロントエンドの起動

```bash
pnpm rr:dev
```

このコマンドにより、Wranglerを使用したローカル開発サーバーが起動します。デフォルトでは、`http://localhost:8787` でアプリケーションにアクセスできます。

特定のポートを指定する場合は、以下のようにします：

```bash
cd packages/rr
wrangler dev --port 3000
```

### 4.2 Hono APIの起動

```bash
pnpm hono:dev
```

このコマンドにより、Hono APIのローカル開発サーバーが起動します。デフォルトでは、`http://localhost:3000` でAPIにアクセスできます。

### 4.3 型定義の生成

React Routerアプリケーションの型定義を更新するには：

```bash
pnpm rr:types
```

Hono APIの型定義を更新するには：

```bash
pnpm hono:types
```

## 5. データベース操作方法

このプロジェクトでは、Cloudflare D1（SQLiteベースのデータベース）とDrizzle ORMを使用しています。

### 5.1 データベースマイグレーション

#### 5.1.1 マイグレーションファイルの生成

スキーマに変更を加えた後、マイグレーションファイルを生成します：

```bash
pnpm db:generate
```

#### 5.1.2 ローカル環境へのマイグレーション適用

```bash
pnpm db:push:local
pnpm db:migrate:local
```

#### 5.1.3 本番環境へのマイグレーション適用

```bash
pnpm db:push:prod
pnpm db:migrate:prod
```

### 5.2 データベースの閲覧・操作

Drizzle Studioを使用してデータベースを視覚的に操作できます：

```bash
pnpm db:studio
```

Drizzle Studioを終了するには：

```bash
pnpm db:studio:kill
```

## 6. 本番環境へのデプロイ方法

### 6.1 React Routerフロントエンドのデプロイ

```bash
cd packages/rr
pnpm deploy
```

または、ルートディレクトリから：

```bash
pnpm --filter=rr deploy
```

### 6.2 Hono APIのデプロイ

```bash
cd packages/hono-api
pnpm deploy
```

または、ルートディレクトリから：

```bash
pnpm --filter=hono-api deploy
```

### 6.3 アカウント確認・切り替え

現在のCloudflareアカウントを確認：

```bash
wrangler whoami
```

アカウントの切り替え：

```bash
wrangler logout
wrangler login
```

## 7. 機能の使い方

### 7.1 Hono API

Hono APIは以下のエンドポイントを提供しています：

#### 7.1.1 ルートエンドポイント

- **URL**: `/`
- **メソッド**: GET
- **説明**: APIが正常に動作していることを確認するためのシンプルなエンドポイント
- **レスポンス**: "Hello Hono!"というテキスト

#### 7.1.2 顧客一覧取得

- **URL**: `/api/customers`
- **メソッド**: GET
- **説明**: 登録されている全ての顧客情報を取得
- **レスポンス**: JSON形式の顧客データ配列

```json
{
  "customers": [
    {
      "CustomerId": 1,
      "CompanyName": "Alfreds Futterkiste",
      "ContactName": "Maria Anders"
    },
    ...
  ]
}
```

### 7.2 React Routerフロントエンド

#### 7.2.1 顧客一覧の表示

アプリケーションのホーム画面または `/customers` パスにアクセスすると、登録されている顧客の一覧が表示されます。各顧客の会社名、担当者名、およびアクション（詳細表示、編集、削除）が表示されます。

### 7.2.2 顧客詳細の表示

顧客一覧から顧客の会社名または「詳細」リンクをクリックすると、その顧客の詳細情報が表示されます。

### 7.2.3 新規顧客の登録

1. 顧客一覧画面の「新規登録」ボタンをクリックします。
2. 表示されたフォームに会社名と担当者名を入力します。
3. 「登録」ボタンをクリックして保存します。

### 7.2.4 顧客情報の編集

1. 顧客一覧または詳細画面から「編集」リンクをクリックします。
2. 表示されたフォームで会社名や担当者名を変更します。
3. 「更新」ボタンをクリックして変更を保存します。

### 7.2.5 顧客の削除

1. 顧客一覧または詳細画面から「削除」リンクをクリックします。
2. 確認画面で「delete」と入力して削除を確認します。
3. 「削除する」ボタンをクリックして顧客を削除します。

## 8. トラブルシューティング

### 8.1 ローカル開発環境の問題

#### 8.1.1 データベース接続エラー

ローカルデータベースに接続できない場合は、以下を確認してください：

1. `.wrangler-persist` ディレクトリが存在するか確認
2. 必要に応じて以下のコマンドでローカルデータベースを再作成：

```bash
cd packages/rr
wrangler d1 execute crd-sample-db --local --file=./schema.sql
```

#### 8.1.2 型エラー

型エラーが発生した場合は、型定義を再生成してください：

```bash
pnpm rr:types
pnpm typecheck
```

### 8.2 デプロイの問題

デプロイに失敗した場合は、以下を確認してください：

1. Cloudflareアカウントにログインしているか確認
2. `wrangler.jsonc` の設定が正しいか確認
3. D1データベースが正しく設定されているか確認

## 9. 開発者向け情報

### 9.1 プロジェクト構造

```txt
/
├── packages/
│   ├── db/                 # データベース関連のコード
│   │   ├── drizzle/        # マイグレーションファイル
│   │   └── src/            # スキーマ定義
│   │       ├── index.ts    # エクスポート
│   │       └── schema.ts   # テーブル定義
│   │
│   ├── hono-api/           # Hono APIバックエンド
│   │   ├── src/            # ソースコード
│   │   │   └── index.ts    # APIエントリーポイント
│   │   └── wrangler.jsonc  # Wrangler設定
│   │
│   └── rr/                 # React Routerアプリケーション
│       ├── app/            # アプリケーションコード
│       │   ├── routes/     # ルート定義
│       │   └── utils/      # ユーティリティ
│       ├── workers/        # Cloudflare Workersコード
│       └── wrangler.jsonc  # Wrangler設定
│
└── package.json            # ルートパッケージ設定
```

### 9.2 テスト

現在、このプロジェクトには自動テストが含まれていません。テストを追加する場合は、Vitest等のテストフレームワークを導入することをお勧めします。

### 9.3 環境変数

環境変数は `wrangler.jsonc` の `vars` セクションで設定できます。機密情報は以下のコマンドでシークレットとして設定してください：

```bash
wrangler secret put <KEY>
```

シークレットを削除するには：

```bash
wrangler secret delete <KEY>
```
