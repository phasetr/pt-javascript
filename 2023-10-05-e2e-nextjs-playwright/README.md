# README.md

- Udemy: [【E2Eテスト編】Playwright + Next.js 13 App Router によるフロントエンドテスト](https://www.udemy.com/course/e2e-nextjs-app-dir-playwright)
- [GitHub](https://github.com/GomaGoma676/e2e-nextjs-playwright)

## Next.js project setup

### Next.js

```bash
npx create-next-app@13.2.5-canary.34 --tailwind nextjs-e2e --use-npm
npm i next@13.2.5-canary.34
```

- install package

```bash
npm i next-auth@4.18.6 @prisma/client@4.8.0 @next-auth/prisma-adapter@1.0.5 date-fns@2.29.3 zustand@4.1.5 zod@3.20.2 @heroicons/react@2.0.13
```

- install package

```bash
npm i -D prisma@4.8.0 @playwright/test@1.29.0
```

- install playwright

```bash
npx playwright install
```

### Postgres DB

- start db

~~~bash
docker compose up -d
~~~

- remove db

~~~bash
docker compose rm -s -f -v
~~~

### Prisma

- init

~~~bash
npx prisma init
~~~

- migrate

~~~bash
npx prisma migrate dev
~~~

- gen types

~~~bash
npx prisma generate
~~~
