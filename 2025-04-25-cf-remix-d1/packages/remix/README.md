# Welcome to React Router

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Previewing the Production Build

Preview the production build locally:

```bash
npm run preview
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Deployment is done using the Wrangler CLI.

To build and deploy directly to production:

```sh
npm run deploy
```

To deploy a preview URL:

```sh
npx wrangler versions upload
```

You can then promote a version to production after verification or roll it out progressively.

```sh
npx wrangler versions deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## Database

This template uses [Cloudflare D1](https://developers.cloudflare.com/d1/) as the database and [Drizzle ORM](https://orm.drizzle.team/) for database access.

### Database Schema

The database schema is defined in `app/db/schema.ts` using Drizzle's type-safe schema builder.

### Migrations

Database migrations are managed using Drizzle Kit:

1. Generate migration files from your schema:

   ```bash
   npm run db:generate
   ```

2. Apply migrations to your local development database:

   ```bash
   npm run db:migrate:local
   ```

3. Apply migrations to production:

   ```bash
   npm run db:migrate:prod
   ```

### Seed Data

Seed data is defined in `drizzle/seed.sql` and can be applied with:

```bash
npm run db:seed:local  # For local development
npm run db:seed:prod   # For production
```

### Reset Database

To reset the database (apply migrations and seed data):

```bash
npm run db:reset:local  # For local development
npm run db:reset:prod   # For production
```

### Database Studio

Drizzle Kit provides a visual interface to explore your database:

```bash
npm run db:studio
```

---

Built with ❤️ using React Router.
