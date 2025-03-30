import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage } from "~/utils/session.server";

/**
 * Google認証を開始するローダー
 * このルートにアクセスすると、Googleの認証ページにリダイレクトされる
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // セッションストレージを作成
  const env = context.env as Record<string, string>;
  const sessionStorage = createCloudflareSessionStorage(env);
  
  // 認証インスタンスを作成
  const authenticator = createAuthenticator(sessionStorage, env);
  
  // リダイレクト先を取得
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";
  
  // Google認証を開始
  // このメソッドは内部でGoogleの認証ページにリダイレクトする
  return await authenticator.authenticate("google", request);
}

// このページはレンダリングされることはないが、Remixの規約に従って空のコンポーネントを定義
export default function GoogleAuth() {
  return null;
}
