import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// Cloudflare D1用のデータベース
export function createD1Db(d1Database: D1Database): DrizzleD1Database<typeof schema> {
  return drizzle(d1Database, { schema });
}

export type Database = DrizzleD1Database<typeof schema>;