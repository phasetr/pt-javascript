# トラブルシューティング: モジュールタイプの不一致と型エラー

## 発生した問題

Hono APIのビルド時に以下のエラーが発生しました：

```txt
src/index.ts:3:27 - error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("aws-utils")' call instead.
  To convert this file to an ECMAScript module, change its file extension to '.mts', or add the field `"type": "module"` to '/Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/hono-api/package.json'.

3 import { sendEmail } from "aws-utils";
                            ~~~~~~~~~~~

src/test-email-api.ts:10:19 - error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("node-fetch")' call instead.
  To convert this file to an ECMAScript module, change its file extension to '.mts', or add the field `"type": "module"` to '/Users/user/dev/phasetr-tmp/cf-cdk-queue-mail/packages/hono-api/package.json'.

10 import fetch from "node-fetch";
                     ~~~~~~~~~~~~

src/test-email-api.ts:47:24 - error TS18046: 'data' is of type 'unknown'.

47     if (response.ok && data.success) {
                          ~~~~

src/test-email-api.ts:49:31 - error TS18046: 'data' is of type 'unknown'.

49       console.log(`メッセージID: ${data.messageId}`);
                                 ~~~~

src/test-email-api.ts:53:34 - error TS18046: 'data' is of type 'unknown'.

53       console.error(`エラーメッセージ: ${data.error || "不明なエラー"}`);
                                    ~~~~
```

## 原因

1. **モジュールタイプの不一致**:
   - `packages/aws-utils/package.json` には `"type": "module"` が設定されており、ECMAScript モジュール (ESM) として扱われています。
   - `packages/hono-api/package.json` には `"type": "module"` が設定されておらず、デフォルトの CommonJS モジュールとして扱われています。
   - ESM モジュールを CommonJS モジュールから `require` を使って読み込むことはできません。

2. **型の不明確さ**:
   - `test-email-api.ts` で `response.json()` の戻り値に型アサーションが行われていないため、`data` が `unknown` 型として扱われています。

## 解決策

1. **モジュールタイプの統一**:
   - `packages/hono-api/package.json` に `"type": "module"` を追加して、Hono API パッケージも ESM として扱うようにしました。

    ```json
    {
      "name": "hono-api",
      "type": "module",
      "scripts": {
        // ...
      }
    }
    ```

2. **型アサーションの追加**:
   - `test-email-api.ts` の `response.json()` の戻り値に型アサーションを追加しました。

```typescript
const data = await response.json() as {
  success: boolean;
  messageId?: string;
  error?: string;
};
```

## 学んだこと

1. **モジュールタイプの一貫性**:
   - プロジェクト内のパッケージ間でモジュールタイプ（CommonJS または ESM）を一貫させることが重要です。
   - 特に、依存関係がある場合は、モジュールタイプを揃える必要があります。

2. **型安全性の確保**:
   - 外部APIからのレスポンスデータには、適切な型アサーションを行うことで型安全性を確保できます。
   - `unknown` 型のままプロパティにアクセスすると、TypeScriptはエラーを報告します。

3. **エラーメッセージの読み方**:
   - TypeScriptのエラーメッセージには、問題の原因と解決策が含まれていることが多いです。
   - 今回のケースでは、エラーメッセージに `add the field "type": "module" to package.json` という解決策が明示されていました。
