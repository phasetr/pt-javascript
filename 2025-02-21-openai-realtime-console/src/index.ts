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
import dotenv from "dotenv";
import { exit } from "node:process";
import {
	SHOW_TIMING_MATH,
	LOG_EVENT_TYPES,
	sessionUpdate,
} from "./constants.js";

// .envファイルを読み込む
dotenv.config();

// Initialize Fastify
export const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Root Route
fastify.get("/", async (_request, reply) => {
	const jst = nowJst();
	console.log(`This is get /: 現在の日本時刻: ${jst}`);
	reply.type("application/json").code(200);
	reply.send({
		message: `Twilio Media Stream Server is running by fastify, ${jst}`,
	});
});

// WebSocket route for media-stream
fastify.register(async (fastify) => {
	fastify.get(
		"/media-stream",
		{ websocket: true },
		async (connection, _req) => {
			console.log(`👺👺media-stream: ${nowJst()}`);
			console.log("Client connected");

			try {
				// Connection-specific state
				let streamSid: string | null = null;
				let latestMediaTimestamp = 0;
				let lastAssistantItem: string | null = null;
				let markQueue: string[] = [];
				let responseStartTimestampTwilio: number | null = null;
				let returnMessages: string[] = [];
				const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
				if (OPENAI_API_KEY === "") {
					console.error("YOU MUST SET AN OPENAI_API_KEY!");
					exit(0);
				}

				// OpenAIとのやりとりのためのWebSocketを作成
				const openAiWs = createRealtimeApiWebSocket(OPENAI_API_KEY);

				// Control initial session with OpenAI
				const initializeSession = () => {
					console.log("Sending session update:", JSON.stringify(sessionUpdate));
					openAiWs.send(JSON.stringify(sessionUpdate));
					// Uncomment the following line to have AI speak first:
					// sendInitialConversationItem();
				};

				// Send initial conversation item if AI talks first

				// Handle interruption when the caller's speech starts
				const handleSpeechStartedEvent = () => {
					if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
						const elapsedTime =
							latestMediaTimestamp - responseStartTimestampTwilio;
						if (SHOW_TIMING_MATH)
							console.log(
								`Calculating elapsed time for truncation: ${latestMediaTimestamp} - ${responseStartTimestampTwilio} = ${elapsedTime}ms`,
							);

						if (lastAssistantItem) {
							const truncateEvent = {
								type: "conversation.item.truncate",
								item_id: lastAssistantItem,
								content_index: 0,
								audio_end_ms: elapsedTime,
							};
							if (SHOW_TIMING_MATH)
								console.log(
									"Sending truncation event:",
									JSON.stringify(truncateEvent),
								);
							openAiWs.send(JSON.stringify(truncateEvent));
						}

						connection.send(
							JSON.stringify({
								event: "clear",
								streamSid: streamSid,
							}),
						);

						// Reset
						markQueue = [];
						lastAssistantItem = null;
						responseStartTimestampTwilio = null;
					}
				};

				// Send mark messages to Media Streams so we know if and when AI response playback is finished
				const sendMark = (connection: WebSocket, streamSid: string | null) => {
					if (streamSid) {
						const markEvent = {
							event: "mark",
							streamSid: streamSid,
							mark: { name: "responsePart" },
						};
						connection.send(JSON.stringify(markEvent));
						markQueue.push("responsePart");
					}
				};

				// Open event for OpenAI WebSocket
				openAiWs.on("open", () => {
					console.log("Connected to the OpenAI Realtime API");
					setTimeout(initializeSession, 100);
				});

				// Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
				openAiWs.on("message", (data) => {
					try {
						const response = JSON.parse(data.toString());

						if (LOG_EVENT_TYPES.includes(response.type)) {
							console.log(`Received event: ${response.type}`, response);
						}

						switch (response.type) {
							case "response.text.delta":
								// We got a new text chunk, print it
								// connection.send(response.delta);
								returnMessages.push(response.delta);
								break;
							case "response.text.done":
								{
									// The text is complete, print a new line
									const returnMessage = returnMessages.join("");
									connection.send(returnMessage);
									returnMessages = [];
								}
								break;
							case "response.done":
								{
									// Response complete, close the socket
									connection.send("👺THE END OF RESPONSE\n");
								}
								break;
						}

						if (response.type === "response.audio.delta" && response.delta) {
							const audioDelta = {
								event: "media",
								streamSid: streamSid,
								media: { payload: response.delta },
							};
							connection.send(JSON.stringify(audioDelta));

							// First delta from a new response starts the elapsed time counter
							if (!responseStartTimestampTwilio) {
								responseStartTimestampTwilio = latestMediaTimestamp;
								if (SHOW_TIMING_MATH)
									console.log(
										`Setting start timestamp for new response: ${responseStartTimestampTwilio}ms`,
									);
							}

							if (response.item_id) {
								lastAssistantItem = response.item_id;
							}

							sendMark(connection, streamSid);
						}

						if (response.type === "input_audio_buffer.speech_started") {
							handleSpeechStartedEvent();
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

				// Handle incoming messages from Twilio
				connection.on("message", (message) => {
					try {
						const data = message.toString();
						switch (data) {
							case "--delete":
								streamSid = nowJst().toString();
								console.log("Incoming stream has started", streamSid);
								// Reset start and media timestamp on a new stream
								responseStartTimestampTwilio = null;
								latestMediaTimestamp = 0;
								break;
							case "":
								console.log("👺Input is empty.");
								break;
							default:
								if (openAiWs.readyState === WebSocket.OPEN) {
									/*
                  const audioAppend = {
										type: "input_audio_buffer.append",
										audio: data.media.payload,
									};
									openAiWs.send(JSON.stringify(audioAppend));
                  */
									openAiWs.send(JSON.stringify(createConversationItem(data)));
									openAiWs.send(JSON.stringify(createResponse()));
								}
								break;
						}

						/*
						switch (data.event) {
							case "media":
								latestMediaTimestamp = data.media.timestamp;
								if (SHOW_TIMING_MATH)
									console.log(
										`Received media message with timestamp: ${latestMediaTimestamp}ms`,
									);
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
								console.log("Incoming stream has started", streamSid);

								// Reset start and media timestamp on a new stream
								responseStartTimestampTwilio = null;
								latestMediaTimestamp = 0;
								break;
							case "mark":
								if (markQueue.length > 0) {
									markQueue.shift();
								}
								break;
							default:
								console.log("👺👺Received non-media event:", data.event);
								break;
						}
            */
					} catch (error) {
						console.error("Error parsing message:", error, "Message:", message);
					}
				});

				// Handle connection close
				connection.on("close", () => {
					if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
					console.log("Client disconnected.");
				});

				// Handle WebSocket close and errors
				openAiWs.on("close", () => {
					console.log("Disconnected from the OpenAI Realtime API");
				});

				openAiWs.on("error", (error) => {
					console.error("Error in the OpenAI WebSocket:", error);
				});
			} catch (e) {
				console.error(e);
			}
		},
	);
});

const PORT: number = process.env.PORT
	? Number.parseInt(process.env.PORT, 10)
	: 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(
		`Server is listening on port ${PORT} by fastify in fastify.listen!`,
	);
});
