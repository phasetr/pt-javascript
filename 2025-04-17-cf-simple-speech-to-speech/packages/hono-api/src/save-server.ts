/**
 * Save Server for OpenAI Realtime Speech-to-Speech
 *
 * This server listens on port 3500 and saves audio data and transcription results
 * from OpenAI Realtime Speech-to-Speech API to local files.
 *
 * - Run `npm run save-server` to start the server
 */

import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { exec } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import type { Socket } from "node:net";
import { join } from "node:path";
import { promisify } from "node:util";
import { WebSocketServer } from "ws";

const execPromise = promisify(exec);

dotenv.config();

// Create output directory if it doesn't exist
const OUTPUT_DIR = join(process.cwd(), "output");
if (!existsSync(OUTPUT_DIR)) {
	mkdirSync(OUTPUT_DIR, { recursive: true });
}

const app = new Hono();
// WebSocketサーバーの初期化
const wss = new WebSocketServer({ noServer: true });

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
						mp3: mp3FilePath,
					},
				});
			} catch (ffmpegError) {
				console.error(
					"Error converting audio to MP3 with ffmpeg:",
					ffmpegError,
				);
				// If conversion fails, at least return the ulaw file path
				return c.json({
					success: true,
					paths: {
						ulaw: ulawFilePath,
					},
					error: "Failed to convert to MP3 format",
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

		if (type === "json") {
			// Save JSON data
			const jsonFilePath = join(
				sessionDir,
				`${sessionId}_${formattedTimestamp}.json`,
			);
			writeFileSync(jsonFilePath, data);
			console.log(`JSON saved to: ${jsonFilePath}`);
			return c.json({ success: true, path: jsonFilePath });
		}

		return c.json({ error: "Invalid data type" }, 400);
	} catch (error) {
		console.error("Error saving data:", error);
		return c.json({ error: "Failed to save data" }, 500);
	}
});

const port = 3500;

// Set the event handler for the WebSocket server
wss.on("connection", (ws, request) => {
	const headers = request.headers;
	const headersObj: Record<string, string | string[] | undefined> = {};
	for (const [key, value] of Object.entries(headers)) {
		headersObj[key] = value;
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const sessionId = `ws-headers-${timestamp}`;

	const sessionDir = join(OUTPUT_DIR, sessionId);
	if (!existsSync(sessionDir)) {
		mkdirSync(sessionDir, { recursive: true });
	}

	const headerFilePath = join(sessionDir, `${sessionId}.json`);
	writeFileSync(headerFilePath, JSON.stringify(headersObj, null, 2));

	ws.send(
		JSON.stringify({
			message: "Save the header!",
			path: headerFilePath,
		}),
	);

	ws.on("message", (message) => {
		console.log(`Receive a message from a client: ${message}`);
	});

	ws.on("close", () => {
		console.log("Close a connection");
	});
});

// Node.jsの標準的なHTTPサーバーを作成
const httpServer = createServer();

// Honoアプリをサーバーに接続
const server = {
	fetch: app.fetch,
	server: httpServer,
};

// WebSocketサーバーの設定
httpServer.on(
	"upgrade",
	(request: IncomingMessage, socket: Socket, head: Buffer) => {
		const pathname = new URL(
			request.url || "",
			`http://${request.headers.host || "localhost"}`,
		).pathname;

		if (pathname === "/ws") {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit("connection", ws, request);
			});
		} else {
			console.log(
				"Close a connection because the request is not a WebSocket one",
			);
			socket.destroy();
		}
	},
);

httpServer.on("request", (req: IncomingMessage, res: ServerResponse) => {
	app.fetch(req, res);
});

// サーバーを起動
httpServer.listen(port, () => {
	console.log(`Run the save server: http://localhost:${port}`);
});

export default server;
