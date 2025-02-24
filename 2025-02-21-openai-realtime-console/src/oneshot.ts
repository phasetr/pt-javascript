import type WebSocket from "ws";
import { config } from "dotenv";
import {
	createConversationItem,
	createRealtimeApiWebSocket,
	createResponse,
	nowJst,
} from "./utils";
config();

async function handleOpen(ws: WebSocket) {
	console.log(`${nowJst()}: Connection is opened`);
	// イベントを送信
	ws.send(
		JSON.stringify(
			createConversationItem("Explain in one sentence what a web socket is"),
		),
	);
	ws.send(JSON.stringify(createResponse()));
}

async function handleMessage(ws: WebSocket, messageStr: string) {
	const message = JSON.parse(messageStr);
	// console.log(`${nowJst()}: handleMessage, ${message.type}`);
	// Define what happens when a message is received
	switch (message.type) {
		case "response.text.delta":
			// We got a new text chunk, print it
			process.stdout.write(message.delta);
			break;
		case "response.text.done":
			// The text is complete, print a new line
			process.stdout.write("\n");
			break;
		case "response.done":
			// Response complete, close the socket
			ws.close();
			break;
	}
}

async function handleClose() {
	console.log(`${nowJst()}: Socket closed`);
}

async function handleError(error: Error) {
	console.error(`${nowJst()}: Error`, error);
}

function main() {
	const openai_api_key = process.env.OPENAI_API_KEY || "";
	if (openai_api_key === "") {
		console.error("👺👺WE HAVE AN EMPTY OPENAI_API_KEY👺👺");
	}

	const ws = createRealtimeApiWebSocket(openai_api_key);
	ws.on("open", () => handleOpen(ws));
	ws.on("message", (messageStr: string) => handleMessage(ws, messageStr));
	ws.on("close", handleClose);
	ws.on("error", handleError);
}
main();
