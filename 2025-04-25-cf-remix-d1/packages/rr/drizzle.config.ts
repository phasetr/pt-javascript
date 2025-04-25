import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // SQLiteとして設定（D1はSQLiteと互換性がある）
  dbCredentials: {
    // ローカル開発時はWranglerが作成するローカルのD1データベースファイルを使用
    url: './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f253421848505bfd644490698e36d17977501ad2587c6ba0fd479180a316f09a.sqlite'
  },
  verbose: true,
  strict: true,
} satisfies Config;
