import Fastify from "fastify";
import WebSocket from "ws";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import {
	createConversationItem,
	createRealtimeApiWebSocket,
	createResponse,
	nowJst,
} from "./utils.js";
import { exit } from "node:process";
import { LOG_EVENT_TYPES, sessionUpdate } from "./constants.js";

// Initialize Fastify
export const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// WebSocket route for media-stream
fastify.register(async (fastify) => {
	fastify.get("/", { websocket: true }, async (connection, _req) => {
		console.log("Client connected");

		try {
			// Connection-specific state
			let streamSid: string | null = null;
			/** クライアントに返すメッセージを貯める配列 */
			let returnMessages: string[] = [];
			/** OpenAIのAPIキー */
			const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
			if (OPENAI_API_KEY === "") {
				console.error("YOU MUST SET AN OPENAI_API_KEY!");
				exit(0);
			}

			/** OpenAIとのやりとりのためのWebSocketを作成 */
			const openAiWs = createRealtimeApiWebSocket(OPENAI_API_KEY);

			/** Open event for OpenAI WebSocket and initialize a session */
			openAiWs.on("open", () => {
				console.log("Connected to the OpenAI Realtime API");
				setTimeout(() => {
					openAiWs.send(JSON.stringify(sessionUpdate));
				}, 100);
			});

			/** Listen for messages from the OpenAI WebSocket (and send to a client) */
			openAiWs.on("message", (data) => {
				try {
					const response = JSON.parse(data.toString());

					if (LOG_EVENT_TYPES.includes(response.type)) {
						console.log(`Received event: ${response.type}`);
					}

					switch (response.type) {
						case "response.text.delta":
							// OpenAIからの応答が差分で送られてくるため、配列に保存して後で一気に出力する
							returnMessages.push(response.delta);
							break;
						case "response.text.done":
							// 差分が尽きてRealtime APIからの全応答が取得できたためクライアントに応答を返す
							connection.send(returnMessages.join(""));
							returnMessages = [];
							break;
						case "response.done":
							connection.send("👺THE END OF RESPONSE👺\n");
							break;
					}
				} catch (error) {
					console.error(
						"Error processing OpenAI message:",
						error,
						"Raw message:",
						data,
					);
				}
			});

			/** クライアントからの入力を処理する */
			connection.on("message", (message) => {
				try {
					const data = message.toString();
					switch (data) {
						case "--delete":
							streamSid = nowJst().toString();
							console.log("Incoming stream has started", streamSid);
							break;
						case "":
							console.log("👺Input is empty.");
							break;
						default:
							if (openAiWs.readyState === WebSocket.OPEN) {
								openAiWs.send(JSON.stringify(createConversationItem(data)));
								openAiWs.send(JSON.stringify(createResponse()));
							}
							break;
					}
				} catch (error) {
					console.error("Error parsing message:", error, "Message:", message);
				}
			});

			/** OpenAIとのWebSocket接続を解除 */
			connection.on("close", () => {
				if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
				console.log("Client disconnected.");
			});

			/** OpenAIとのWebSocketを閉じたときの挙動定義 */
			openAiWs.on("close", () => {
				console.log("Disconnected from the OpenAI Realtime API");
			});

			/** OpenAIとのWebSocketでエラーが出た時の挙動定義 */
			openAiWs.on("error", (error) => {
				console.error("Error in the OpenAI WebSocket:", error);
			});
		} catch (e) {
			console.error(e);
		}
	});
});
