# 問題

Hono・HonoXで`vite`と`wrangler (D1)`がうまく連携できるかを検証するプロジェクトです。現状ではHonoでのAPIサーバーは packages/api にあって`wrangler`コマンドで動作させる前提、React Routerは packages/rr にあって`react-router`コマンドで動作させる前提で起動しています。特にReact Routerは `react-router` コマンドによる改発サーバーの起動で tailwind+wrangler がなめらかに連携しています。この `react-router` コマンドと同じような仕組みが HonoX にあるかどうかがわかっていません。現状では packages/honox の`pnpm dev`で`tailwind`は発動するものの`D1`連携できず、`pnpm preview`で`tailwind`は発動しないものの`D1`連携できます。
[GitHubのREADME](https://github.com/honojs/honox)や、@yusukebeさんのサンプル集[honox-examples](https://github.com/yusukebe/honox-examples)も見たのですが、どう設定すれば`react-router`のように両方同時に動作する開発サーバーが立ち上げられるでしょうか。
