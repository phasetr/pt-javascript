import WebSocket from "ws";
import { config } from "dotenv";
import { nowJst } from "./utils";
config();

async function handleOpen(ws: WebSocket) {
	console.log(`${nowJst()}: Connection is opened`);

	const createConversationEvent = {
		type: "conversation.item.create",
		item: {
			type: "message",
			role: "user",
			content: [
				{
					type: "input_text",
					text: "Explain in one sentence what a web socket is",
				},
			],
		},
	};
	// イベントを送信
	ws.send(JSON.stringify(createConversationEvent));

	const createResponseEvent = {
		type: "response.create",
		response: {
			modalities: ["text"],
			instructions: "Please assist the user.",
		},
	};
	ws.send(JSON.stringify(createResponseEvent));
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
	// Connect to the API
	const url =
		"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
	const ws = new WebSocket(url, {
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"OpenAI-Beta": "realtime=v1",
		},
	});

	ws.on("open", () => handleOpen(ws));
	ws.on("message", (messageStr: string) => handleMessage(ws, messageStr));
	ws.on("close", handleClose);
	ws.on("error", handleError);
}
main();
