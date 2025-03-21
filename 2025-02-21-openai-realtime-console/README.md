# README

- オリジナルの記事：[OpenAI Realtime API: A Guide With Examples](https://www.datacamp.com/tutorial/realtime-api-openai)
- [ドキュメント](https://platform.openai.com/docs/guides/realtime-model-capabilities#text-inputs-and-outputs)
- 参考：WebRTC、GitHub, [openai-realtime-console](https://github.com/openai/openai-realtime-console)
- [Twilio+OpenAI Realtime APIに関するTwilio公式](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-node)
- 参考メモ：[2024-10-29 Realtime APIとTwilioを用いた電話予約デモシステムの構築](https://www.ai-shift.co.jp/techblog/4980)

## 使い方

```sh
cp .env.example .env
```

- `.env`に`OPENAI_API_KEY`を記入
- `WAF`を適切に指定：標準は`.env.sample`に記入した値
  - 他の候補は`src/index.ts`の条件分岐を見ること

```sh
npm run dev
```

```sh
curl http://localhost:3000
```

```sh
wscat -c ws://localhost:3000/media-stream
```
