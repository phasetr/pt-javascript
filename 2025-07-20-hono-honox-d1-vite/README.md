# README

## HonoX

- GitHub: [honojs/honox](https://github.com/honojs/honox)
- GitHub: [yusukebe/honox-examples](https://github.com/yusukebe/honox-examples)

## Drizzle

- <https://phasetr.com/archive/fc/pg/web/#drizzle-orm>

## 注意

- `packages/rr`では`packages/db`が生成するルート直下の`.wrangler-persist`を読み込めない（設定法がわからない）ため、`packages/rr`内部に`db`と`migrations`を持ってきた。
- `packages/honox`では`pnpm honox:dev:wrangler`は起動するが`tailwind`連携がなく、`pnpm honox:dev`では`tailwind`は挟まるが`D1`連携できない。
