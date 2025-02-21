import WebSocket from "ws";
import { config } from "dotenv";
import { nowJst } from "./utils";
config();

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

	async function handleOpen() {
		// Define what happens when the connection is opened
		// Create and send an event to initiate a conversation
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
		// Create and send an event to initiate a response
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
	ws.on("open", handleOpen);

	// Add inside the main() function of index.js
	async function handleMessage(messageStr: string) {
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
	ws.on("message", handleMessage);

	async function handleClose() {
		console.log(`${nowJst()}: Socket closed`);
	}
	ws.on("close", handleClose);

	async function handleError(error: Error) {
		console.error(`${nowJst()}: Error`, error);
	}
	ws.on("error", handleError);
}
main();
