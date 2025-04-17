# README

A minimal example that works in Node.js but does not work on Cloudflare.

## How to launch the application

### Cloudflare (wrangler dev)

- `ngrok http 3000`
- Create the `.dev.vars` file from `.dev.vars.sample` and fill it
- Run `pnpm dev` at the `packages hono-api` directory

### Node.js

- `ngrok http 3000`
- Create the `.env` file from `.env.sample` and fill it
- Run `pnpm dev:node` at the `packages hono-api` directory
