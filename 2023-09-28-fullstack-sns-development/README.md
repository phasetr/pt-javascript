# README

- [【Next.js/Node.js/Prisma/Supabase】本格的なSNSアプリをフルスタック構築するマスター講座](https://www.udemy.com/course/fullstack-sns-development/)
- [フロントエンド](https://github.com/Shin-sibainu/udemy-sns-client)
- [バックエンド](https://github.com/Shin-sibainu/udemy-sns-api)
- 最終的なリリース部分は未対応：`env`の設定はしている

## フロントエンド

```shell
npx create-next-app client --ts
```

## バックエンド

```shell
npm init -y
```

- `Prisma`初期化周りは公式を確認しよう
- マイグレーションは次の通り

```shell
npx prisma migrate dev --name <some name>
npx prisma migrate dev --name init
```

## supabase

- 2023-09-28-fullstack-sns-development
- FHw7VzR6X30W9eU8
