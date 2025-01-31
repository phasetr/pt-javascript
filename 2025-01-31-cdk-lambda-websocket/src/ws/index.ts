import Fastify, { type FastifyRequest } from "fastify";
import websocket from "@fastify/websocket";
import type WebSocket from "ws";

const fastify = Fastify();
fastify.register(websocket);

fastify.register(async (fastify) => {
	fastify.get(
		"/",
		{ websocket: true },
		(socket: WebSocket.WebSocket, _req: FastifyRequest) => {
			socket.on("message", (data) => {
				const message = data.toString();
				console.log("メッセージを受信しました: ", message);
				socket.send("hi from server");
			});
		},
	);
});

// WebSocketルートの定義
fastify.register(async (fastify) => {
	fastify.get("/ws", { websocket: true }, (socket, _req) => {
		console.log("WebSocket接続が確立しました");

		// メッセージを受信したときの処理
		socket.on("message", (data) => {
			const messageString = data.toString();
			console.log("メッセージを受信しました:", messageString);
			socket.send(`FROM SERVER: ${messageString}`);
		});
		// 接続が閉じられたときの処理
		socket.on("close", () => {
			console.log("クライアントとの接続が閉じられました");
		});
		// エラーが発生したときの処理
		socket.on("error", (err) => {
			console.error("エラーが発生しました:", err.message);
		});
	});
});

// サーバーの起動
fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log("サーバーがポート3000で起動しました");
});
