import fs from "node:fs";
import path from "node:path";
import * as schema from "@pnpm-e2e/core/db/schema";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";

let db: ReturnType<typeof drizzle<typeof schema>>;

export async function setupDatabase() {
	// sql.jsを初期化
	const SQL = await initSqlJs();

	// オンメモリSQLiteデータベースを作成
	const sqlite = new SQL.Database();
	db = drizzle(sqlite, { schema });

	// マイグレーションファイルを手動で実行
	const possiblePaths = [
		path.resolve(process.cwd(), "../../packages/core/migrations"),
		path.resolve(process.cwd(), "../core/migrations"),
		path.resolve(process.cwd(), "packages/core/migrations"),
	];

	let migrationsPath: string | null = null;
	for (const testPath of possiblePaths) {
		if (fs.existsSync(testPath)) {
			migrationsPath = testPath;
			break;
		}
	}

	if (!migrationsPath) {
		throw new Error(
			`Migration directory not found. Tried: ${possiblePaths.join(", ")}`,
		);
	}

	console.log(`Found migrations in: ${migrationsPath}`);

	try {
		// マイグレーションファイルを読み込んで実行
		const migrationFiles = fs
			.readdirSync(migrationsPath)
			.filter((file) => file.endsWith(".sql"))
			.sort();

		console.log(
			`Found ${migrationFiles.length} migration files:`,
			migrationFiles,
		);

		for (const file of migrationFiles) {
			const filePath = path.join(migrationsPath, file);
			const sql = fs.readFileSync(filePath, "utf-8");
			console.log(`Running migration: ${file}`);
			sqlite.exec(sql);
		}

		console.log("Database migration completed successfully");

		// データが正しく挿入されたか確認
		const result = sqlite.exec("SELECT COUNT(*) as count FROM numbers");
		if (result.length > 0) {
			console.log(`Initial data count: ${result[0].values[0][0]}`);
		}
	} catch (error) {
		console.error("Migration failed:", error);
		console.error("Error details:", error);
		throw error;
	}

	return db;
}

export function getDatabase() {
	if (!db) {
		throw new Error("Database not initialized. Call setupDatabase() first.");
	}
	return db;
}
