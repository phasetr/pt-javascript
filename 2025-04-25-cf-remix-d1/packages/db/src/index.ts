import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema.js";

// D1Databaseからdrizzleクライアントを作成する関数
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// スキーマをエクスポート
export * from "./schema.js";
