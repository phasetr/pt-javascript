# README

- `node`: `16.17.0`
- `yarn`: `npm i -g yarn`
- GitHub, backend: [restapi-todo-nestjs](https://github.com/GomaGoma676/restapi-todo-nestjs)

## backend, NestJS

```shell
npm i -g yarn
npm i -g @nestjs/cli
nest new api-lesson
```

- `localhost:3005`で起動するように設定

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
yarn add cookie-parser csurf passport passport-jwt bcrypt class-validator
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
