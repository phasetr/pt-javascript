import Fastify from "fastify";
import WebSocket from "ws";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import { nowJst } from "./utils.js";
import dotenv from "dotenv";

// .envファイルを読み込む
dotenv.config();

// Initialize Fastify
export const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Constants
const SYSTEM_MESSAGE = "Respond simply.";
const VOICE = "alloy";

// List of Event Types to log to the console. See the OpenAI Realtime API Documentation: https://platform.openai.com/docs/api-reference/realtime
const LOG_EVENT_TYPES = [
	"error",
	"response.content.done",
	"rate_limits.updated",
	"response.done",
	"input_audio_buffer.committed",
	"input_audio_buffer.speech_stopped",
	"input_audio_buffer.speech_started",
	"session.created",
];

// Show AI response elapsed timing calculations
const SHOW_TIMING_MATH = false;

// Root Route
fastify.get("/", async (_request, reply) => {
	const jst = nowJst();
	console.log(`This is get /: 現在の日本時刻: ${jst}`);
	reply.type("application/json").code(200);
	reply.send({
		message: `Twilio Media Stream Server is running by fastify, ${jst}`,
	});
});

// Route for Twilio to handle incoming calls
// <Say> punctuation to improve text-to-speech translation
fastify.all("/incoming-call", async (_request, reply) => {
	try {
		console.log(`👺This is get /incoming-call: ${nowJst()}`);
		const SERVICE_URL = process.env.SERVICE_URL;
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>Hello, I am an assistant.</Say>
    <Pause length="1"/>
    <Say>You can start talking!</Say>
    <Connect>
      <Stream url="wss://${SERVICE_URL}/media-stream" />
    </Connect>
  </Response>`;
		reply.type("text/xml").send(twimlResponse);
	} catch (e) {
		console.log("環境変数の取得に失敗しました。", e);
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>We have some errors, sorry.</Say>
  </Response>`;
		reply.type("text/xml").send(twimlResponse);
	}
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
				const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

				const openAiWs = new WebSocket(
					"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
					{
						headers: {
							Authorization: `Bearer ${OPENAI_API_KEY}`,
							"OpenAI-Beta": "realtime=v1",
						},
					},
				);

				// Control initial session with OpenAI
				const initializeSession = () => {
					const sessionUpdate = {
						type: "session.update",
						session: {
							turn_detection: { type: "server_vad" },
							input_audio_format: "g711_ulaw",
							output_audio_format: "g711_ulaw",
							voice: VOICE,
							instructions: SYSTEM_MESSAGE,
							modalities: ["text", "audio"],
							temperature: 0.8,
						},
					};

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
						const data = JSON.parse(message.toString());

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
								console.log("Received non-media event:", data.event);
								break;
						}
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
