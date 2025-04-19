/**
 * Save Server for OpenAI Realtime Speech-to-Speech
 *
 * This server listens on port 3500 and saves audio data and transcription results
 * from OpenAI Realtime Speech-to-Speech API to local files.
 *
 * - Run `npm run save-server` to start the server
 */

import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

dotenv.config();

// Create output directory if it doesn't exist
const OUTPUT_DIR = join(process.cwd(), "output");
if (!existsSync(OUTPUT_DIR)) {
	mkdirSync(OUTPUT_DIR, { recursive: true });
}

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
	return c.json({
		message: "OpenAI Realtime Speech-to-Speech Save Server",
		version: "1.0.0",
	});
});

// Endpoint to save audio data and transcription
app.post("/save-data", async (c) => {
	try {
		const { sessionId, type, data, timestamp } = await c.req.json();

		if (!sessionId || !type || !data) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		// Create session directory if it doesn't exist
		const sessionDir = join(OUTPUT_DIR, sessionId);
		if (!existsSync(sessionDir)) {
			mkdirSync(sessionDir, { recursive: true });
		}

		const formattedTimestamp =
			timestamp || new Date().toISOString().replace(/[:.]/g, "-");

		if (type === "audio") {
			// Save audio data
			const audioBuffer = Buffer.from(data, "base64");
			const audioFilePath = join(
				sessionDir,
				`${sessionId}_${formattedTimestamp}_audio.ulaw`,
			);
			writeFileSync(audioFilePath, audioBuffer);
			console.log(`Audio saved to: ${audioFilePath}`);
			return c.json({ success: true, path: audioFilePath });
		}

		if (type === "transcription") {
			// Save transcription
			const transcriptionFilePath = join(
				sessionDir,
				`${sessionId}_${formattedTimestamp}_transcription.txt`,
			);
			writeFileSync(transcriptionFilePath, data);
			console.log(`Transcription saved to: ${transcriptionFilePath}`);
			return c.json({ success: true, path: transcriptionFilePath });
		}

		return c.json({ error: "Invalid data type" }, 400);
	} catch (error) {
		console.error("Error saving data:", error);
		return c.json({ error: "Failed to save data" }, 500);
	}
});

const port = 3500;

export default serve({
	fetch: app.fetch,
	port,
});
