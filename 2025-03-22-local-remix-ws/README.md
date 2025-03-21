# README

## プロジェクト概要

RemixでMPAと共存した形でAPIが作れるか確認したい。
APIはcurlでアクセスできるHTTP APIと、
wscatでアクセスできるWebSocket APIの両方が同時に実装できるか確認したい。
APIは`api`ディレクトリを切ってこの中にファイルをまとめ、WAFの`Hono`を使って実装する。

## プロジェクトの略称

LRW

## 基本的なインフラ

ローカルでの簡単な検証目的で、どこかのインフラにはリリースしない

## 基本方針

どのような指示に対してAIがどのような結果を返したか,
さらに同じ結果を再現できるようにするため,
`prompts`ディレクトリに`日付-日時.md`のファイル名フォーマットにしたがって,
同じ結果を再現できるようなプロンプトと処理概要を都度保存する.
特に長いプログラムの詳細は処理概要に含めなくてよい.
図・表が必要な場合は`mermaid`など適切なフォーマットで記録する.

## Welcome to Remix

- 📖 [Remix docs](https://remix.run/docs)

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
