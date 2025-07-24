/**
 * @fileoverview SQLite EFS direct access handler
 */

import type { SelectRandom } from "./sqlite.js";
import { createSqliteDb, getAllRandomRecords } from "./sqlite.js";

/**
 * Response structure for SQLite EFS requests
 */
export interface SqliteEfsResponse {
	readonly data: readonly SelectRandom[];
	readonly response_time_ms: number;
}

/**
 * Handle SQLite EFS direct access request
 * @param efsPath - Path to EFS SQLite file (default: /mnt/efs/data.db)
 * @returns Promise resolving to response with data and timing information
 */
export async function handleSqliteEfsRequest(
	efsPath = "/mnt/efs/data.db",
): Promise<SqliteEfsResponse> {
	const startTime = Date.now();

	// Create database connection to EFS file
	const db = createSqliteDb(`file:${efsPath}`);

	// Read all records from SQLite
	const data = await getAllRandomRecords(db);

	const responseTime = Date.now() - startTime;

	return {
		data,
		response_time_ms: responseTime,
	};
}
