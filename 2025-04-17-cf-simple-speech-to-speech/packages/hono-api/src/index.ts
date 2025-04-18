/**
 * Hono API Server (for Cloudflare Workers environment)
 *
 * This file is for Cloudflare Workers environment.
 * For Node.js environment, please use index.node.ts.
 *
 * - Run `npm run dev` in your terminal to start a Cloudflare Workers development server
 * - Run `npm run deploy` to publish your worker to Cloudflare
 */

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

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
		SERVICE_URL: c.env.SERVICE_URL || "",
		OPENAI_API_KEY: c.env.OPENAI_API_KEY || "",
		ENVIRONMENT: c.env.ENVIRONMENT || "development",
		CLOUDFLARE: c.env.CLOUDFLARE || "true",
	});
	await next();
});
app.use("*", logger());
app.use("*", cors());

app.get("/", (c: Context) => {
	return c.json({
		message: "CWHDT API Server on Cloudflare",
		version: "1.0.0",
	});
});

app.all("/incoming-call", async (c: Context) => {
	try {
		const envVars = c.get("envVars");
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>You can start talking on Cloudflare!</Say>
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

app.get(
	"/ws-voice",
	async (
		c: Context<{
			Bindings: {
				OPENAI_API_KEY?: string;
				SERVICE_URL?: string;
				ENVIRONMENT?: string;
				CLOUDFLARE?: string;
			};
		}>,
	) => {
		const webSocketPair = new WebSocketPair();
		const client = webSocketPair[0];
		const server = webSocketPair[1];

		try {
			// Not in Node.js version
			const upgradeHeader = c.req.header("Upgrade");
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				return c.text("Expected Upgrade: websocket", 400);
			}

			// Connection-specific state
			let streamSid: string | null = null;
			let latestMediaTimestamp = 0;
			let lastAssistantItem: string | null = null;
			let markQueue: string[] = [];
			let responseStartTimestampTwilio: number | null = null;

			const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
			if (!OPENAI_API_KEY) {
				console.error("OpenAI API Key is not set");
				return c.text("OpenAI API Key is not set", 500);
				// throw new Error("OpenAI API Key is not set");
			}

			// Not in Node.js version
			// Manage connection state with OpenAI server
			let openAiConnected = false;
			let conversationStarted = false;

			// Create WebSocket connection with OpenAI
			const openAiWs = await (async () => {
				try {
					const response = await fetch(
						// Different from node.js: here we use https, not wss
						"https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
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
						},
					);

					// @ts-ignore
					const webSocket = response.webSocket;

					if (!webSocket) {
						throw new Error(
							"Failed to connect WebSocket: response.webSocket is null",
						);
					}

					// Establish WebSocket connection
					// @ts-ignore
					webSocket.accept();

					webSocket.addEventListener("error", (error: Event) => {
						console.error("👺WebSocket connection error:", error);
					});

					return webSocket;
				} catch (error) {
					console.error("👺WebSocket connection error:", error);
					throw error;
				}
			})();

			// Handler for when connection with OpenAI server is established
			openAiWs.addEventListener("open", async () => {
				openAiConnected = true; // Node.js版にはない
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

			// Listen for messages from the OpenAI WebSocket (and send to client if necessary)
			openAiWs.addEventListener("message", async (event: MessageEvent) => {
				try {
					const response =
						event.data instanceof ArrayBuffer
							? JSON.parse(new TextDecoder().decode(event.data))
							: JSON.parse(event.data);

					// Node.js版にはない
					if (response.type === "session.created") {
						openAiConnected = true;
					}

					if (response.type === "response.audio.delta" && response.delta) {
						const audioDelta = {
							event: "media",
							streamSid: streamSid,
							media: { payload: response.delta },
						};
						server.send(JSON.stringify(audioDelta));

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
							server.send(JSON.stringify(markEvent));
							markQueue.push("responsePart");
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

							server.send(
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
			server.addEventListener("message", async (event: MessageEvent) => {
				try {
					// データがArrayBufferかどうかをチェック
					const data =
						event.data instanceof ArrayBuffer
							? JSON.parse(new TextDecoder().decode(event.data))
							: JSON.parse(event.data);

					switch (data.event) {
						case "media":
							latestMediaTimestamp = data.media.timestamp;

							if (openAiWs.readyState === WebSocket.OPEN) {
								const audioAppend = {
									type: "input_audio_buffer.append",
									audio: data.media.payload,
								};
								openAiWs.send(JSON.stringify(audioAppend));

								// Not in Node.js version
								// If conversation has not started yet, start it
								if (openAiConnected && !conversationStarted) {
									// Create empty conversation item (for voice input)
									openAiWs.send(
										JSON.stringify({
											type: "conversation.item.create",
											item: {
												type: "message",
												role: "user",
												content: [],
											},
										}),
									);
									// Send response creation request
									openAiWs.send(
										JSON.stringify({
											type: "response.create",
											response: {
												modalities: ["text", "audio"],
												instructions: "Respond simply.",
											},
										}),
									);
									conversationStarted = true;
								}
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
			server.addEventListener("close", async () => {
				if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
			});

			// Handle WebSocket close and errors
			openAiWs.addEventListener("close", async () => {
				// Node.js版にはない
				openAiConnected = false;
			});

			// Handling errors from OpenAI WebSocket
			openAiWs.addEventListener("error", async (error: Event) => {
				console.error("OpenAI WebSocket error:", error);
			});
		} catch (e) {
			console.error("WebSocket setup error:", e);
			return c.text("Internal Server Error", 500);
		}

		// Not in Node.js version
		// Start WebSocket connection
		server.accept();
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	},
);

app.get(
	"/ws-chat",
	async (
		c: Context<{
			Bindings: {
				OPENAI_API_KEY?: string;
				SERVICE_URL?: string;
				ENVIRONMENT?: string;
				CLOUDFLARE?: string;
			};
		}>,
	) => {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 400);
		}

		const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
		if (!OPENAI_API_KEY) {
			console.error("YOU MUST SET AN OPENAI_API_KEY!");
			return c.text("OpenAI API Key is not set", 500);
		}

		// Create WebSocketPair
		// @ts-ignore
		const webSocketPair = new WebSocketPair();
		const client = webSocketPair[0];
		const server = webSocketPair[1];

		/** Array to store messages to be returned to the client */
		const returnMessages: string[] = [];

		// Create WebSocket connection with OpenAI
		const openAiWs = await (async () => {
			try {
				// Send WebSocket upgrade request using fetch API
				const response = await fetch(
					"https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
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
					},
				);

				// @ts-ignore
				const webSocket = response.webSocket;

				if (!webSocket) {
					throw new Error(
						"Failed to connect WebSocket connection: response.webSocket is null",
					);
				}

				// Establish WebSocket connection
				// @ts-ignore
				webSocket.accept();

				// Add error handling
				webSocket.addEventListener("error", (error: Event) => {
					console.error("👺WebSocket connection error:", error);
				});

				console.log("👺OpenAI Realtime API WebSocket connection established");
				return webSocket;
			} catch (error) {
				console.error("👺WebSocket connection error:", error);
				throw error;
			}
		})();

		// Manage connection state with OpenAI server
		let openAiConnected = false;

		// Send session update message immediately after WebSocket connection is established
		openAiWs.send(
			JSON.stringify({
				type: "session.update",
				session: {
					instructions: "Respond simply.",
					modalities: ["text"],
					temperature: 0.8,
				},
			}),
		);

		// Handler for when connection with OpenAI server is established
		openAiWs.addEventListener("open", () => {
			console.log("Connected to the OpenAI Realtime API");
			openAiConnected = true;
		});

		// Handling close event from OpenAI WebSocket
		openAiWs.addEventListener("close", () => {
			console.log("Disconnected from the OpenAI Realtime API");
			openAiConnected = false;
		});

		// Handling errors from OpenAI WebSocket
		openAiWs.addEventListener("error", (error: Event) => {
			console.error("OpenAI WebSocket error:", error);
			if (error instanceof Error) {
				console.error(error.message);
			}
		});

		// Processing messages from OpenAI WebSocket
		openAiWs.addEventListener("message", (event: MessageEvent) => {
			try {
				// Convert data to string if it's ArrayBuffer
				const response =
					typeof event.data === "string"
						? JSON.parse(event.data)
						: JSON.parse(new TextDecoder().decode(event.data));

				// Set openAiConnected flag to true when session.created event is received
				if (response.type === "session.created") {
					openAiConnected = true;
				}

				// Process based on response type
				switch (response.type) {
					case "response.text.delta":
						// Verify delta exists
						if (typeof response.delta !== "string") {
							console.error("Received delta is not a string:", response.delta);
							return;
						}

						// Store delta in array
						returnMessages.push(response.delta);

						// Check if paragraph breaks are included
						if (response.delta.includes("\n\n")) {
							// Concatenate all deltas and split into paragraphs
							const paragraphs = returnMessages.join("").split("\n\n");
							// Remove the last element as it may not be complete yet
							const completeParagraphs = paragraphs.slice(0, -1);
							const remainder = paragraphs[paragraphs.length - 1];

							for (const para of completeParagraphs) {
								if (server.readyState === WebSocket.OPEN) {
									server.send(para);
								}
							}
							// Re-accumulate the incomplete paragraph part
							returnMessages.length = 0; // Clear array
							returnMessages.push(remainder);
						}
						break;
					case "response.text.done":
						// Build final text and send it split by paragraphs
						{
							const fullMessage = returnMessages.join("");
							const paragraphs = fullMessage.split("\n\n");

							for (const para of paragraphs) {
								if (
									para.trim() !== "" &&
									server.readyState === WebSocket.OPEN
								) {
									server.send(para);
								}
							}
						}
						returnMessages.length = 0; // Clear array
						break;
					case "response.done":
						if (server.readyState === WebSocket.OPEN) {
							server.send("👺THE END OF RESPONSE👺\n");
						}
						break;
				}
			} catch (error) {
				console.error(
					"Error processing OpenAI message:",
					error,
					"Raw message:",
					event.data,
				);
			}
		});

		// Process messages from client
		server.addEventListener("message", (event: MessageEvent) => {
			try {
				// Convert data to string if it's ArrayBuffer
				const data =
					typeof event.data === "string"
						? event.data
						: new TextDecoder().decode(event.data);

				switch (data) {
					case "--delete":
						break;
					case "":
						console.log("Input is empty.");
						break;
					default:
						if (openAiConnected) {
							const conversationItem = {
								type: "conversation.item.create",
								item: {
									type: "message",
									role: "user",
									content: [
										{
											type: "input_text",
											data,
										},
									],
								},
							};
							openAiWs.send(JSON.stringify(conversationItem));

							const responseItem = {
								type: "response.create",
								response: {
									modalities: ["text"],
									instructions: "Please assist the user.",
								},
							};
							openAiWs.send(JSON.stringify(responseItem));
						} else {
							console.warn(
								"Cannot send message because connection with OpenAI is not established",
							);
						}
						break;
				}
			} catch (e) {
				console.error(e);
			}
		});

		// Event handler for errors
		server.addEventListener("error", (event: Event) => {
			console.error("WebSocket error:", event);
		});

		// Event handler for when connection is closed
		server.addEventListener("close", () => {
			console.log("WebSocket connection closed");
			if (openAiConnected) {
				openAiWs.close();
				openAiConnected = false;
			}
		});

		// @ts-ignore - Cloudflare Workers固有のAPIのため型エラーを無視
		server.accept();
		server.send("We connected to you!");

		return new Response(null, {
			status: 101,
			// @ts-ignore
			webSocket: client,
		});
	},
);

export default app;
