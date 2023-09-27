# README

- [Next.js 13 App Router による次世代Web開発](https://www.udemy.com/course/nextjs-supabase-app-directory/)
- コースのGitHub: [https://github.com/GomaGoma676/nextjs-app-router-supabase](https://github.com/GomaGoma676/nextjs-app-router-supabase)

## メモ

### `Next.js`初期化

```shell
npx create-next-app@13.4.1 --tailwind rsc-supabase --use-npm
npm i @heroicons/react@2.0.17 @supabase/auth-helpers-nextjs@0.6.1 @supabase/supabase-js@2.21.0 zustand@4.3.8 supabase@1.55.1 date-fns@2.30.0
npm i next@13.4.1
```

### Generate supabase types

```shell
npx supabase login
npx supabase init
npx supabase link --project-ref btuuorkabvkhwrscylti
npx supabase gen types typescript --linked > database.types.ts
```

### `Supabase`仕様変更用

- `Foreign key`設定で`auth schema`を選択してから`users table`と`id colomun`を選択
- `uid()`を`auth.uid()`に変更
