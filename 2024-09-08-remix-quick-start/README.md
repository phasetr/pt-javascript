# README

- [クイックスタート](https://remix.run/docs/en/main/start/quickstart)
- [チュートリアル](https://remix.run/docs/en/main/start/tutorial)

## クイックスタート

```shell
npx remix vite:build
npx remix-serve build/server/index.js
```

開発用の`remix-server`ではなく`Express.js`で起動

```shell
npm i express @remix-run/express cross-env
npm uninstall @remix-run/serve
```

```shell
node server.js
```

開発サーバー起動コマンド

```shell
npm run dev
```
