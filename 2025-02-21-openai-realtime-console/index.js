// Import the web socket library
import WebSocket from "ws";
// Load the .env file into memory so the code has access to the key
import { config } from "dotenv";
config();

function nowJst() {
  const now = new Date();
  return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function main() {
  // Connect to the API
  const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
  const ws = new WebSocket(url, {
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  // Add inside the main() function of index.js after creating ws
  async function handleOpen() {
    console.log(`${nowJst()}: Connection is opened`);
  }
  ws.on("open", handleOpen);

  // Add inside the main() function of index.js
  async function handleMessage(messageStr) {
    const message = JSON.parse(messageStr);
    console.log(`${nowJst()}: `, message);
  }
  ws.on("message", handleMessage);

  async function handleClose() {
    console.log(`${nowJst()}: Socket closed`);
  }
  ws.on("close", handleClose);

  async function handleError(error) {
    console.error(`${nowJst()}: Error`, error);
  }
  ws.on("error", handleError);
}
main();
