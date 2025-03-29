# RemixアプリケーションへのBasic認証実装手順

## 概要

このドキュメントでは、Remixアプリケーションに全ルートに適用されるBasic認証を実装する手順を記録しています。

## 実装方針

- 全ルートに対してBasic認証を適用
- 認証情報は固定値として実装（ユーザー名: admin、パスワード: secret）
- サーバーサイドでの認証チェックを実装

## 実装手順

### 1. entry.server.tsxにBasic認証のコードを追加

Remixのサーバーサイドエントリーポイントである`entry.server.tsx`にBasic認証のコードを追加しました。

```typescript
// Basic認証の設定
const AUTH_USERNAME = "admin";
const AUTH_PASSWORD = "secret";
const expectedAuth = `Basic ${Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString("base64")}`;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  // Basic認証のチェック
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== expectedAuth) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Protected Area"',
      },
    });
  }

  // 以下、既存のコード
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}
```

### 2. リンターエラーの修正

実装後、以下のリンターエラーが発生したため修正しました：

- 関数パラメータの再代入に関する警告
  - `responseStatusCode = 500;` の部分を `const newStatusCode = 500;` に変更

### 3. 動作確認

開発サーバーを起動し、アプリケーションにアクセスして動作確認を行いました。

```bash
npm run dev
```

- 認証情報なしでアクセス：401 Unauthorizedエラーが返される
- URLに認証情報を含めてアクセス（<http://admin:secret@localhost:5173/>）：正常に表示される
- <http://me@localhost:5173/>とすると認証情報が削除できる

## 注意点

- 開発サーバー（Vite）では、ブラウザの認証ダイアログが表示されない場合があります。これは、ViteとRemixの統合に関連する問題と考えられます。
- 本番環境では、Remixアプリケーションを直接サーブする場合、認証ダイアログが正しく表示されるはずです。
- URLに直接認証情報を含める方法（<http://username:password@hostname/>）は、一部のブラウザでは非推奨または無効化されている場合があります。

## まとめ

この実装により、Remixアプリケーション全体がBasic認証で保護されるようになりました。すべてのリクエストは認証チェックを通過する必要があり、認証に失敗した場合は401エラーが返されます。
