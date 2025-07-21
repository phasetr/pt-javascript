# How to Run Tailwind CSS and D1 Database Simultaneously During HonoX Development

## Overview・Question

I have a question about setting up a development server in a HonoX project to run both Tailwind CSS and D1 database simultaneously. I'll explain the details below, but first, let me state my questions:

1. Is there a way to configure HonoX to run both Tailwind CSS and Wrangler (D1 database) simultaneously with a single command (e.g., `pnpm dev`)?

   Currently, in another project, I'm using `concurrently`, e.g, `concurrently "vite build --watch" "wrangler dev --local --persist-to ../../.wrangler-persist --live-reload --port 8787"`, to run vite build and PostCSS to embed tailwind processing results into `_renderer.tsx`, while connecting D1 from the port started by wrangler, but I'm dissatisfied with how messy `_renderer.tsx` becomes.

2. If there are best practices for achieving an integrated development experience for tailwind+D1, similar to React Router's `react-router dev`, please let me know.

My sample repository is here: [2025-07-20-hono-honox-d1-vite](https://github.com/phasetr/pt-javascript/tree/main/2025-07-20-hono-honox-d1-vite).

## Current Situation

[2025-07-20-hono-honox-d1-vite](https://github.com/phasetr/pt-javascript/tree/main/2025-07-20-hono-honox-d1-vite) is my project.

### Project Structure

HonoX and React Router only have a homepage, where they connect to the database to retrieve and display data.

- `packages/api`: Hono API server (started with `wrangler dev`, D1 integration available)
- `packages/rr`: React Router (started with `react-router dev`, Tailwind + D1 integration available)
- `packages/honox`: HonoX application (struggling with configuration)

#### Dev Commands for Each Package

- `packages/api`: `pnpm dev:wrangler` (wrangler dev --persist-to ../../.wrangler-persist)
- `packages/rr`: `pnpm dev` (react-router dev) ← This is the ideal development experience
- `packages/honox`: `pnpm dev` (vite) or `pnpm preview` (wrangler pages dev)

### Current HonoX Operation Status

- `pnpm dev` (vite): Tailwind CSS ✅ / D1 Database ❌
- `pnpm preview` (wrangler pages dev): Tailwind CSS ❌ / D1 Database ✅

## Expected Behavior

I want to achieve an integrated development experience like React Router's `react-router dev` command.

### Success Case with React Router

In `packages/rr`, the following can be achieved with a single command:

- Hot reload support
- Real-time Tailwind CSS reflection
- D1 database connection
- TypeScript compilation

### Ideal State for HonoX

Achieve the following simultaneously with a single command like React Router's `react-router dev`:

- ✅ Hot reload with Vite or Wrangler
- ✅ Real-time Tailwind CSS reflection
- ✅ D1 database access (data retrieval from users table)
- ✅ Intuitive and rapid development cycle for developers

## Configurations Tried

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import honox from "honox/vite";
import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { getPlatformProxy } from "wrangler";

export default defineConfig(async () => {
  const { env, dispose } = await getPlatformProxy({
    configPath: "./wrangler.toml",
    persistTo: "../../.wrangler-persist",
  });

  return {
    plugins: [
      tailwindcss(),
      honox({
        devServer: {
          env,
          adapter,
          plugins: [{ onServerClose: dispose }],
        },
      }),
      pages(),
    ],
    // Other configurations...
  };
});
```

### wrangler.toml

```toml
name = "honox"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./dist"

[dev]
port = 8787

[[d1_databases]]
binding = "DB"
database_name = "local-db"
database_id = "local-db"
preview_database_id = "local-db"
```

## Environment Information

- HonoX: v0.1.43
- Hono: v4.8.5
- Vite: v7.0.5
- Wrangler: v4.25.0
- Tailwind CSS: v4.1.11
- TypeScript: v5.8.3
- Node.js: 23.9.0

## Referenced Materials

- [HonoX GitHub Repository](https://github.com/honojs/honox)
- [honox-examples by @yusukebe](https://github.com/yusukebe/honox-examples)

I would appreciate any advice you can provide. Thank you.
