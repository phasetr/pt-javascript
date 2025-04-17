import type { Context } from "hono";
import { nowJst } from "../utils";

/**
 * Twilioからの着信コールを処理するエンドポイント
 * TwiMLレスポンスを返し、WebSocketストリームへの接続を指示する
 */
export const incomingCallHandler = async (c: Context) => {
	try {
		console.log(`👺This is get /incoming-call: ${nowJst()}`);
		// ミドルウェアでセットされた環境変数を取得
		const envVars = c.get("envVars");
		const isCloudflare = envVars?.CLOUDFLARE === "true";
		const environment = isCloudflare ? "Cloudflare" : "Node.js";
		const SERVICE_URL = envVars.SERVICE_URL;
		if (!SERVICE_URL) {
			throw new Error("SERVICE_URL is not configured");
		}

		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Pause length="2"/>
    <Say>Hello, I am an assistant on ${environment}!</Say>
    <Pause length="1"/>
    <Say>You can start talking!</Say>
    <Connect>
      <Stream url="wss://${SERVICE_URL}/ws-voice" />
    </Connect>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	} catch (e) {
		console.error("環境変数の取得に失敗しました。", e);
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>We have some errors, sorry.</Say>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	}
};
