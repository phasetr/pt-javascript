/**
 * WebSocketエンドポイント
 *
 * 3種類のWebSocketエンドポイントを提供します：
 * 1. /ws - シンプルなエコーサーバー
 * 2. /ws-chat - OpenAI Realtime APIを使用したチャットサーバー
 * 3. /ws-voice - OpenAI Realtime APIを使用した音声対話サーバー
 */

export { wsChatHandler } from "./ws-chat-handler";
export { wsSimpleHandler } from "./ws-simple-handler";
export { wsVoiceHandler } from "./ws-voice-handler";
