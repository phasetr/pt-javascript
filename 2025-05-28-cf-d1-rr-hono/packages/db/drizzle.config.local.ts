import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/b20c8cfb-8038-43a9-94a7-07b03f8b0fb0.sqlite',
  },
} satisfies Config;