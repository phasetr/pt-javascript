import type { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import WebSocket from "ws";
import {
	createConversationItem,
	createRealtimeApiWebSocket,
	createResponse,
	nowJst,
} from "./utils.js";
import { exit } from "node:process";
import { LOG_EVENT_TYPES, sessionUpdate } from "./constants.js";
import dotenv from "dotenv";

dotenv.config();

export function honoWs(app: Hono) {
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
	app.get(
		"/",
		upgradeWebSocket((_c) => {
			/** OpenAIのAPIキー取得 */
			const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
			if (OPENAI_API_KEY === "") {
				console.error("YOU MUST SET AN OPENAI_API_KEY!");
				exit(0);
			}
			// 接続固有の状態
			let streamSid: string | null = null;
			/** クライアントに返すメッセージをためる配列 */
			let returnMessages: string[] = [];
			// 各接続のクライアント側 WebSocket を保持する変数
			let clientWs: WebSocket | null = null;

			/** OpenAIとのやりとりのためのWebSocketを作成 */
			const openAiWs = createRealtimeApiWebSocket(OPENAI_API_KEY);

			// OpenAIサーバーとの接続が確立したらセッション更新用のメッセージを送信
			openAiWs.on("open", () => {
				console.log("Connected to the OpenAI Realtime API");
				setTimeout(() => {
					openAiWs.send(JSON.stringify(sessionUpdate));
				}, 100);
			});
			// OpenAI WebSocket側のcloseイベントのハンドリング
			openAiWs.on("close", () => {
				console.log("Disconnected from the OpenAI Realtime API");
			});
			// OpenAI WebSocket側のエラー発生時のハンドリング
			openAiWs.on("error", (error) => {
				console.error("Error in the OpenAI WebSocket:", error);
			});
			// openAiWsのmessageイベントリスナーを１度だけ登録し、クライアントへの送信用にclientWsを活用する
			openAiWs.on("message", (data) => {
				try {
					const response = JSON.parse(data.toString());

					if (LOG_EVENT_TYPES.includes(response.type)) {
						console.log(`Received event: ${response.type}`);
					}

					switch (response.type) {
						case "response.text.delta":
							// 差分を配列にためる
							returnMessages.push(response.delta);
							break;
						case "response.text.done":
							// 差分の連結結果をクライアントへ送信
							if (clientWs && clientWs.readyState === WebSocket.OPEN) {
								clientWs.send(returnMessages.join(""));
							}
							returnMessages = [];
							break;
						case "response.done":
							if (clientWs && clientWs.readyState === WebSocket.OPEN) {
								clientWs.send("👺THE END OF RESPONSE👺\n");
							}
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

			try {
				return {
					onOpen(_event, ws) {
						clientWs = ws as unknown as WebSocket;
						console.log("client connected.");
						ws.send("We connected to you!");
					},
					// WebSocket接続終了時の処理
					onClose(_event, _ws) {
						if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
						console.log("Client disconnected.");
					},
					onError(event, ws) {
						console.error(event);
						ws.send("We have some error. Sorry.");
					},
					// クライアントからのメッセージを処理
					onMessage(event, ws) {
						try {
							// const data = message.toString();
							const data = event.data.toString();
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
						} catch (e) {
							console.error(e);
						}
					},
				};
			} catch (e) {
				console.error(e);
				return {
					onOpen(_event, ws) {
						console.log("A client connected.");
						ws.send("Error in some process");
					},
					// WebSocket接続終了時の処理
					onClose(_event, ws) {
						console.log("Client disconnected.");
						ws.send("Error in some process");
					},
					onError(event, ws) {
						console.error(event);
						ws.send("We have an error.");
					},
					// クライアントからのメッセージを処理
					onMessage(event, ws) {
						try {
							console.error(event);
							ws.send("Error in onMessage.");
						} catch (e) {
							console.error(e);
						}
					},
				};
			}
		}),
	);
	return injectWebSocket;
}
