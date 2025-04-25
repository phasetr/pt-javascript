import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // SQLiteとして設定（D1はSQLiteと互換性がある）
  dbCredentials: {
    url: ':memory:' // 実際のマイグレーション実行時はD1を使用
  },
  verbose: true,
  strict: true,
} satisfies Config;
