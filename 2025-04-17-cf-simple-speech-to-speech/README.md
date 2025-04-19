# README

A minimal example that works in Node.js but does not work on Cloudflare.

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)
- [OpenAI Realtime conversations](https://platform.openai.com/docs/guides/realtime-conversations)
- [ORIGINAL](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-node)
- APIリファレンス：[このあたり](https://platform.openai.com/docs/api-reference/realtime-server-events)に返り値の`JSON`のデータの定義がある
- 公式：[リアルタイムの会話](https://platform.openai.com/docs/guides/realtime-conversations#handling-audio-with-websockets)
  - 「`response.audio.done`および`response.done`イベントには実際には音声データは含まれず、音声コンテンツの書き起こしのみが含まれることに注意してください」

## How to launch the application

### Cloudflare (wrangler dev)

- `ngrok http 3000`
- Create the `.dev.vars` file from `.dev.vars.sample` and fill it
- Run `pnpm dev` at the `packages hono-api` directory

### Node.js

- `ngrok http 3000`
- Create the `.env` file from `.env.sample` and fill it
- Run `pnpm dev:node` at the `packages hono-api` directory
