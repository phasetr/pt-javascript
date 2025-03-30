import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage } from "~/utils/session.server";

/**
 * Google認証のコールバックを処理するローダー
 * Google認証が完了した後、このルートにリダイレクトされる
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // セッションストレージを作成
  const env = context.env as Record<string, string>;
  const sessionStorage = createCloudflareSessionStorage(env);
  
  // 認証インスタンスを作成
  const authenticator = createAuthenticator(env, sessionStorage);
  
  // リダイレクト先を取得
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";
  
  // Google認証のコールバックを処理
  // 認証が成功した場合は指定されたリダイレクト先に、失敗した場合はログインページにリダイレクトする
  try {
    // 認証を試みる
    const user = await authenticator.authenticate("google", request);
    
    // 認証が成功した場合、セッションにユーザー情報を保存してリダイレクト
    const session = await sessionStorage.getSession();
    session.set("userId", user.id);
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    // 認証に失敗した場合はログインページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?error=${encodeURIComponent("認証に失敗しました")}`,
      },
    });
  }
}

// このページはレンダリングされることはないが、Remixの規約に従って空のコンポーネントを定義
export default function GoogleAuthCallback() {
  return null;
}
