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
	// http
	app.get("/", async (c) => {
		try {
			// すぐ確認できるように削除ではなくコメントアウト
			// const { OPENAI_API_KEY, SERVICE_URL } = await getAllSecretValues(
			// 	process.env,
			// );
			const jst = nowJst();
			console.log(`現在の日本時刻: ${jst}`);
			return c.text(`Hello, hono: ${jst}`);
		} catch (e) {
			console.log(e);
			return c.text("We have some errors!");
		}
	});

	// WebSocket
	app.get(
		"/media-stream",
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
							// 部分的に段落の区切りが含まれているか確認
							if (response.delta.includes("\n\n")) {
								// すべての差分を一度連結して段落に分割
								const paragraphs = returnMessages.join("").split("\n\n");
								// 最後の要素はまだ完結していない可能性があるので取り除く
								const completeParagraphs = paragraphs.slice(0, -1);
								const remainder = paragraphs[paragraphs.length - 1];
								for (const para of completeParagraphs) {
									if (clientWs && clientWs.readyState === WebSocket.OPEN) {
										clientWs.send(para);
									}
								}
								// 未完の段落部分を再度蓄積する
								returnMessages = [remainder];
							}
							break;
						case "response.text.done":
							// 最終的なテキストを組み立て、段落ごとに分割して送信
							{
								const fullMessage = returnMessages.join("");
								const paragraphs = fullMessage.split("\n\n");
								for (const para of paragraphs) {
									if (
										para.trim() !== "" &&
										clientWs &&
										clientWs.readyState === WebSocket.OPEN
									) {
										clientWs.send(para);
									}
								}
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
					onMessage(event, _ws) {
						try {
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
