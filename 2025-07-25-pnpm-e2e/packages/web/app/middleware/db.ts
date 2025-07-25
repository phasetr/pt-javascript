import { type Database, schema } from "@pnpm-e2e/core";
import { drizzle } from "drizzle-orm/sql-js";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import sqliteUrl from "/sql-wasm.wasm?url";

let dbInstance: Database | null = null;

async function initDb() {
	if (dbInstance) return dbInstance;

	const initSqlJs = (await import("sql.js")).default;
	const SQL = await initSqlJs({
		locateFile: () => sqliteUrl,
	});

	const sqliteDb = new SQL.Database();

	// テーブル作成（マイグレーションファイルから抜粋）
	sqliteDb.run(`
    CREATE TABLE numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      number INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

	// 初期データ投入
	sqliteDb.run(`
    INSERT INTO numbers (name, number, created_at, updated_at) VALUES
    ('One', 1, datetime('now'), datetime('now')),
    ('Two', 2, datetime('now'), datetime('now')),
    ('Three', 3, datetime('now'), datetime('now')),
    ('Four', 4, datetime('now'), datetime('now')),
    ('Five', 5, datetime('now'), datetime('now'));
  `);

	dbInstance = drizzle(sqliteDb, { schema }) as unknown as Database;
	return dbInstance;
}

export const dbMiddleware: MiddlewareHandler<{
	Variables: {
		db: Database;
	};
}> = createMiddleware(async (c, next) => {
	try {
		const db = await initDb();
		console.log("Setting db:", db);
		c.set("db", db as Database);
		await next();
	} catch (error) {
		console.error("Error in dbMiddleware:", error);
		throw error;
	}
});
