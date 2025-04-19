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
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

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
			const ulawFilePath = join(
				sessionDir,
				`${sessionId}_${formattedTimestamp}_audio.ulaw`,
			);
			writeFileSync(ulawFilePath, audioBuffer);
			console.log(`Audio saved to: ${ulawFilePath}`);
			
			// Create MP3 file path
			const mp3FilePath = join(
				sessionDir,
				`${sessionId}_${formattedTimestamp}_audio.mp3`,
			);
			
			// Convert ulaw to mp3 using system ffmpeg
			try {
				// Use system ffmpeg command to convert ulaw to mp3
				const ffmpegCommand = `ffmpeg -f mulaw -ar 8000 -ac 1 -i "${ulawFilePath}" -acodec libmp3lame -ar 8000 -ac 1 "${mp3FilePath}"`;
				
				await execPromise(ffmpegCommand);
				console.log(`Audio converted and saved to: ${mp3FilePath}`);
				
				return c.json({ 
					success: true, 
					paths: {
						ulaw: ulawFilePath,
						mp3: mp3FilePath
					}
				});
			} catch (ffmpegError) {
				console.error("Error converting audio to MP3 with ffmpeg:", ffmpegError);
				// If conversion fails, at least return the ulaw file path
				return c.json({ 
					success: true, 
					paths: {
						ulaw: ulawFilePath
					},
					error: "Failed to convert to MP3 format"
				});
			}
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
