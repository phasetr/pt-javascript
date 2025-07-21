# HonoXで開発時にTailwind CSSとD1データベースを同時に動作させる方法について

## 概要・質問

HonoXプロジェクトで開発サーバー起動時に、Tailwind CSSとD1データベースの両方を同時に動作させる設定方法についてご質問です。以下で詳しく説明しますが、まず質問を書きます。

1. HonoXで単一のコマンド（例：`pnpm dev`）でTailwind CSSとWrangler（D1データベース）の両方を同時に動作させる設定方法はありますか？

   現在別プロジェクトでは、concurrentlyを利用してvite buildしてPostCSSで`_renderer.tsx`にtailwindの処理結果を埋め込みつつwranglerで起動しているポートからD1連携させていますが、`_renderer.tsx`が汚くなる点が不満です。
2. 特にReact Routerの`react-router dev`のような tailwind+D1 の統合開発体験を実現するベストプラクティスがあれば教えてください。

## 現在の状況

### プロジェクト構成

HonoX, React Routerはホームページだけがあり、そこでデータベースに繋いでデータを取得・表示しています。

- `packages/api`: Hono APIサーバー（`wrangler dev`で起動、D1連携可能）
- `packages/rr`: React Router（`react-router dev`で起動、Tailwind + D1連携可能）
- `packages/honox`: HonoXアプリケーション（設定で困っている）

#### 各パッケージのdev用コマンド

- `packages/api`: `pnpm dev:wrangler` (wrangler dev --persist-to ../../.wrangler-persist)
- `packages/rr`: `pnpm dev` (react-router dev) ← これが理想的な開発体験
- `packages/honox`: `pnpm dev` (vite) または `pnpm preview` (wrangler pages dev)

### 現在のHonoXの動作状況

- `pnpm dev` (vite): Tailwind CSS ✅ / D1データベース ❌
- `pnpm preview` (wrangler pages dev): Tailwind CSS ❌ / D1データベース ✅

## 期待する動作

React Routerの`react-router dev`コマンドのような統合開発体験を実現したいです。

### React Routerでの成功例

`packages/rr`では以下が1つのコマンドで実現できています：

- ホットリロード対応
- Tailwind CSSのリアルタイム反映
- D1データベースへの接続
- TypeScriptコンパイル

### HonoXで求める理想状態

React Routerの`react-router dev`コマンドのような単一のコマンドで以下を同時実現：

- ✅ ViteまたはWranglerによるホットリロード
- ✅ Tailwind CSSのリアルタイム反映  
- ✅ D1データベースアクセス（usersテーブルからのデータ取得）
- ✅ 開発者にとって直感的で迅速な開発サイクル

## 試した設定

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import honox from "honox/vite";
import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { getPlatformProxy } from "wrangler";

export default defineConfig(async () => {
  const { env, dispose } = await getPlatformProxy({
    configPath: "./wrangler.toml",
    persistTo: "../../.wrangler-persist",
  });

  return {
    plugins: [
      tailwindcss(),
      honox({
        devServer: {
          env,
          adapter,
          plugins: [{ onServerClose: dispose }],
        },
      }),
      pages(),
    ],
    // その他の設定...
  };
});
```

### wrangler.toml

```toml
name = "honox"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./dist"

[dev]
port = 8787

[[d1_databases]]
binding = "DB"
database_name = "local-db"
database_id = "local-db"
preview_database_id = "local-db"
```

## 環境情報

- HonoX: v0.1.43
- Hono: v4.8.5
- Vite: v7.0.5
- Wrangler: v4.25.0
- Tailwind CSS: v4.1.11
- TypeScript: v5.8.3
- Node.js: 23.9.0

## 参考にした資料

- [HonoX GitHub Repository](https://github.com/honojs/honox)
- [honox-examples by @yusukebe](https://github.com/yusukebe/honox-examples)

何かアドバイスいただけると助かります。よろしくお願いします。
