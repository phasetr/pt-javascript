# README

- 📖 [Remix docs](https://remix.run/docs)

詳しくは<docs/README.md>を参照。

## メモ：2025-03-24

通常のWeb API（REST API）をHonoで実装してRemixと連携させるのは問題ない。
しかしWebSocket APIはうまく動かないようだ。
少なくとも現状ではWebSocket APIが欲しければ完全に分けて考えるしかないようだ。

## 簡単な動作確認

```sh
npm run dev
```

```sh
curl http://localhost:5173/api/example
```

期待されるレスポンス:

```json
{"message":"Hello, API!"}
```

```bash
curl http://localhost:5173/api/hono
```

期待されるレスポンス:

```json
{"message":"Hello from hono within Remix: 2025/3/24 13:42:24"}
```

注意: レスポンスには現在の日本時間が含まれるため、実行時刻によって異なります。
