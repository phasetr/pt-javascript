# README

- `node`: `16.17.0`
- `yarn`: `npm i -g yarn`
- GitHub, frontend: [frontend-todo-nextjs](https://github.com/GomaGoma676/frontend-todo-nextjs)
- GitHub, backend: [restapi-todo-nestjs](https://github.com/GomaGoma676/restapi-todo-nestjs)

## frontend, Next.js

- Project setup

```shell
npx create-next-app todo-nextjs --ts
```

- install prisma: データベースから`typescript`の型を生成するため

```shell
yarn add -D prisma
npx prisma init
yarn add @prisma/client
```

- Edit DATABASE_URL of .env for postgres container:
  introspect from existing DB

```shell
npx prisma db pull
npx prisma generate
```

- setup tailwind css
- [Tailwind CSS Nextjs](https://tailwindcss.com/docs/guides/nextjs)
- [Mantine UI Nextjs](https://mantine.dev/guides/next/)

```shell
yarn add -D tailwindcss postcss autoprefixer
yarn add -D prettier prettier-plugin-tailwindcss
npx tailwindcss init -p
```

- install necessary packages

```shell
yarn add @tanstack/react-query@4.0.10 @tanstack/react-query-devtools@4.0.10
yarn add @mantine/core@5.0.2 @mantine/hooks@5.0.2 @mantine/form@5.0.2 @mantine/next@5.0.2 @emotion/server@11.10.0 @emotion/react@11.10.0
yarn add @heroicons/react@1.0.6 @tabler/icons@1.78.1 yup@0.32.11 axios@0.27.2 zustand@4.0.0
```

## backend, NestJS

```shell
npm i -g yarn
npm i -g @nestjs/cli
nest new api-lesson
```

- `main.ts`で`localhost:3005`で起動するように設定
- `.env.sample`をコピーして適切に設定

```shell
yarn add -D prisma
yarn add @prisma/client
npx prisma init
```

```shell
npx prisma migrate dev
npx prisma studio
npx prisma generate
```

- install packages

```shell
yarn add @nestjs/config @nestjs/jwt @nestjs/passport 
yarn add cookie-parser csurf passport passport-jwt bcrypt class-validator class-transformer
yarn add -D @types/express @types/cookie-parser @types/csurf @types/passport-jwt @types/bcrypt
```

## Create module, controller, service

```shell
nest g module auth
nest g module user
nest g module todo
nest g module prisma
nest g controller auth --no-spec
nest g controller user --no-spec
nest g controller todo --no-spec
nest g service auth --no-spec
nest g service user --no-spec
nest g service todo --no-spec
nest g service prisma --no-spec
```

```shell
nest g module auth
nest g module user
nest g module todo
nest g module prisma
nest g controller auth
nest g controller user
nest g controller todo
nest g service auth
nest g service user
nest g service todo
nest g service prisma
```
