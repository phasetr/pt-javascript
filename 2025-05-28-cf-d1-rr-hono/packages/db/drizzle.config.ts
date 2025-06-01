import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: 'b20c8cfb-8038-43a9-94a7-07b03f8b0fb0',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
} satisfies Config;