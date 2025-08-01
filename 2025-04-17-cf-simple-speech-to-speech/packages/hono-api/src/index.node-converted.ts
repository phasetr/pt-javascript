/**
 * Hono API Server (for Node.js environment)
 *
 * This file is for Node.js environment.
 * For Cloudflare Workers environment, please use index.ts.
 *
 * - Run `npm run dev:node` to start a Node.js development server
 */

import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type * as http from "node:http";
import WebSocket, { WebSocketServer } from "ws";

dotenv.config();

const app = new Hono<{
	Bindings: {
		OPENAI_API_KEY?: string;
		SERVICE_URL?: string;
		ENVIRONMENT?: string;
		CLOUDFLARE?: string;
	};
}>();

app.use("*", async (c: Context, next: Next) => {
	c.set("envVars", {
		SERVICE_URL: process.env.SERVICE_URL || "",
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		ENVIRONMENT: process.env.ENVIRONMENT || "development",
		CLOUDFLARE: process.env.CLOUDFLARE || "false",
	});
	await next();
});
app.use("*", logger());
app.use("*", cors());

app.get("/", (c: Context) => {
	return c.json({
		message: "CWHDT API Server on Node.js",
		version: "1.0.0",
	});
});

app.all("/incoming-call", async (c: Context) => {
	try {
		const envVars = c.get("envVars");
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>You can start talking on Node.js!</Say>
    <Connect>
      <Stream url="wss://${envVars.SERVICE_URL}/ws-voice" />
    </Connect>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	} catch (e) {
		console.error("Failed to retrieve environment variables.", e);
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>We have some errors, sorry.</Say>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	}
});

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
const server = serve({
	fetch: app.fetch,
	port,
});

const nodeHttpServer = server as unknown as http.Server;
const wss = new WebSocketServer({
	server: nodeHttpServer,
	path: "/ws-voice",
});


// ヘッダー情報を取得するためのアップグレードイベントリスナーを追加
wss.on("headers", (headers, request) => {
	try {
		const timeStamp = new Date().toISOString();
		const headersObject = Object.fromEntries(
			headers.map((header) => {
				const parts = header.split(": ");
				return [parts[0], parts.slice(1).join(": ")];
			})
		);
		
		// ヘッダー情報を保存サーバーに送信
		fetch("http://localhost:3500/save-data", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sessionId: `header-${timeStamp}`,
				type: "json",
				data: JSON.stringify(headersObject),
				timeStamp,
			}),
		}).catch(error => {
			console.error("Error saving headers:", error);
		});
	} catch (error) {
		console.error("Error processing headers:", error);
	}
});

wss.on("connection", async (connection: WebSocket, request) => {
	try {
		// Connection-specific state
		let streamSid: string | null = null;
		let latestMediaTimestamp = 0;
		let lastAssistantItem: string | null = null;
		let markQueue: string[] = [];
		let responseStartTimestampTwilio: number | null = null;

		const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
		if (!OPENAI_API_KEY) {
			throw new Error("OpenAI API Key is not set");
		}

// セッションIDを生成
const currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

// OpenAIのWebSocketに接続
const openAiWs = new WebSocket(
	"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
	{
		headers: {
			Authorization: `Bearer ${OPENAI_API_KEY}`,
			"OpenAI-Beta": "realtime=v1",
			Upgrade: "websocket",
			Connection: "Upgrade",
			"Sec-WebSocket-Version": "13",
			"Sec-WebSocket-Key": btoa(
				Math.random().toString(36).substring(2, 15),
			),
		},
	}
);

// WebSocketが接続されたときにヘッダー情報をシミュレートして保存
openAiWs.on("open", () => {
	// WebSocketの接続が確立されたときに、接続情報を保存
	const timeStamp = new Date().toISOString();
	const simulatedHeaders = {
		connection: "Upgrade",
		upgrade: "websocket",
		"sec-websocket-accept": "accepted",
		date: new Date().toUTCString(),
		server: "OpenAI API Server",
	};
	
	// シミュレートしたヘッダー情報を保存
	fetch("http://localhost:3500/save-data", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sessionId: `header-${timeStamp}`,
			type: "json",
			data: JSON.stringify(simulatedHeaders),
			timeStamp,
		}),
	}).catch(error => {
		console.error("Error saving simulated headers:", error);
	});

	// セッション更新メッセージを送信
	setTimeout(() => {
		const sessionUpdate = {
			type: "session.update",
			session: {
				turn_detection: { type: "server_vad" },
				input_audio_format: "g711_ulaw",
				output_audio_format: "g711_ulaw",
				voice: "alloy",
				instructions: "Respond simply.",
				modalities: ["text", "audio"],
				temperature: 0.8,
			},
		};
		openAiWs.send(JSON.stringify(sessionUpdate));
	}, 100);
});

// Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
openAiWs.on("message", async (data: WebSocket.Data) => {
	try {
		const response = JSON.parse(data.toString());
		if (response.type === "response.audio.delta" && response.delta) {
			try {
				const timeStamp = new Date().toISOString();
				// Save event data raw string
				await fetch("http://localhost:3500/save-data", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						sessionId: currentSessionId,
						type: "transcription",
						data: data.toString(),
						timeStamp,
					}),
				});
				await fetch("http://localhost:3500/save-data", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						sessionId: currentSessionId,
						type: "transcription",
						data: JSON.stringify(response),
						timeStamp,
					}),
				});
				// Save audio delta data
				await fetch("http://localhost:3500/save-data", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						sessionId: currentSessionId,
						type: "audio",
						data: response.delta,
						timeStamp,
					}),
				});
			} catch (error) {
				console.error("Error saving audio delta:", error);
			}

			const audioDelta = {
				event: "media",
				streamSid: streamSid,
				media: { payload: response.delta },
			};
			connection.send(JSON.stringify(audioDelta));

			// First delta from a new response starts the elapsed time counter
			if (!responseStartTimestampTwilio) {
				responseStartTimestampTwilio = latestMediaTimestamp;
			}

			if (response.item_id) {
				lastAssistantItem = response.item_id;
			}
			if (streamSid) {
				const markEvent = {
					event: "mark",
					streamSid: streamSid,
					mark: { name: "responsePart" },
				};
				connection.send(JSON.stringify(markEvent));
				markQueue.push("responsePart");
			}
		}

		// When response is done, save data to the save server
		if (response.type === "response.done") {
			// Save transcription to server if available
			if (response?.response?.output?.[0]?.content?.[0]?.transcript) {
				try {
					await fetch("http://localhost:3500/save-data", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							sessionId: currentSessionId,
							type: "transcription",
							data: response.response?.output?.[0]?.content?.[0].transcript,
							timeStamp: new Date().toISOString(),
						}),
					});
				} catch (error) {
					console.error("Error saving transcription:", error);
				}
			}
		}

		if (response.type === "input_audio_buffer.speech_started") {
			if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
				const elapsedTime =
					latestMediaTimestamp - responseStartTimestampTwilio;

				if (lastAssistantItem) {
					const truncateEvent = {
						type: "conversation.item.truncate",
						item_id: lastAssistantItem,
						content_index: 0,
						audio_end_ms: elapsedTime,
					};
					openAiWs.send(JSON.stringify(truncateEvent));
				}

				connection.send(
					JSON.stringify({
						event: "clear",
						streamSid: streamSid,
					}),
				);

				markQueue = [];
				lastAssistantItem = null;
				responseStartTimestampTwilio = null;
			}
		}
	} catch (error) {
		console.error("Error processing OpenAI message:", error);
	}
});

// Handle incoming messages from Twilio
connection.on("message", async (message: WebSocket.Data) => {
	try {
		const data = JSON.parse(message.toString());

		switch (data.event) {
			case "media":
				latestMediaTimestamp = data.media.timestamp;

				if (openAiWs.readyState === WebSocket.OPEN) {
					const audioAppend = {
						type: "input_audio_buffer.append",
						audio: data.media.payload,
					};
					openAiWs.send(JSON.stringify(audioAppend));
				}
				break;
			case "start":
				streamSid = data.start.streamSid;
				responseStartTimestampTwilio = null;
				latestMediaTimestamp = 0;
				break;
			case "mark":
				if (markQueue.length > 0) {
					markQueue.shift();
				}
				break;
			default:
				break;
		}
	} catch (error) {
		console.error("Error processing Twilio message:", error);
	}
});

// Handle connection close
connection.on("close", async () => {
	if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
});

// Handle WebSocket close and errors
openAiWs.on("close", async () => {
	console.log("OpenAI WebSocket connection closed");
});

// Handling errors from OpenAI WebSocket
openAiWs.on("error", async (error) => {
	console.error("OpenAI WebSocket error:", error);
});
	} catch (e) {
		console.error("WebSocket setup error:", e);
	}
});

export default app;
