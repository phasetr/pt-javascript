/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5000;

// Basic認証の検証関数
function validateBasicAuth(request: Request): boolean {
  // Authorizationヘッダーを取得
  const authHeader = request.headers.get('Authorization');
  
  // Authorizationヘッダーがない場合は認証失敗
  if (!authHeader) {
    return false;
  }
  
  // Basic認証の形式を確認
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic') {
    return false;
  }
  
  // 認証情報をデコード
  const decoded = atob(credentials);
  const [username, password] = decoded.split(':');
  
  // ユーザー名とパスワードを検証
  // 実際の環境では環境変数や設定ファイルから取得することを推奨
  return username === 'admin' && password === 'password';
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  // Basic認証の検証
  if (!validateBasicAuth(request)) {
    // 認証失敗時は401レスポンスを返す
    responseHeaders.set('WWW-Authenticate', 'Basic realm="Secure Area"');
    return new Response('認証が必要です', {
      status: 401,
      headers: responseHeaders,
    });
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);

  const body = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          // Log streaming rendering errors from inside the shell
          console.error(error);
        }
        const responseStatusCode = 500;
      },
    }
  );

  body.allReady.then(() => clearTimeout(timeoutId));

  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
