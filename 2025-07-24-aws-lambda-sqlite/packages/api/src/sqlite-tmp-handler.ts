/**
 * @fileoverview SQLite tmp copy handler
 */
import { access, copyFile, unlink } from "node:fs/promises";
import type { SelectRandom } from "./sqlite.js";
import { createSqliteDb, getAllRandomRecords } from "./sqlite.js";

/**
 * Response structure for SQLite tmp requests
 */
export interface SqliteTmpResponse {
	readonly data: readonly SelectRandom[];
	readonly response_time_ms: number;
	readonly copy_time_ms: number;
	readonly read_time_ms: number;
}

/**
 * Handle SQLite tmp copy request
 * @param efsPath - Path to EFS SQLite file (default: /mnt/efs/data.db)
 * @param tmpPath - Path to tmp SQLite file (default: /tmp/data.db)
 * @returns Promise resolving to response with data and timing information
 */
export async function handleSqliteTmpRequest(
	efsPath = "/mnt/efs/data.db",
	tmpPath = "/tmp/data.db",
): Promise<SqliteTmpResponse> {
	const startTime = Date.now();

	// Remove existing tmp file if it exists
	try {
		await access(tmpPath);
		await unlink(tmpPath);
	} catch {
		// File doesn't exist, which is expected
	}

	// Copy EFS file to tmp
	const copyStartTime = Date.now();
	await copyFile(efsPath, tmpPath);
	const copyTime = Date.now() - copyStartTime;

	// Read data from tmp SQLite file
	const readStartTime = Date.now();
	const db = createSqliteDb(`file:${tmpPath}`);
	const data = await getAllRandomRecords(db);
	const readTime = Date.now() - readStartTime;

	const responseTime = Date.now() - startTime;

	return {
		data,
		response_time_ms: responseTime,
		copy_time_ms: copyTime,
		read_time_ms: readTime,
	};
}
