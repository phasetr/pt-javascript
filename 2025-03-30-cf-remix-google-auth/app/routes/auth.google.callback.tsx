import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage, getSession } from "~/utils/session.server";

/**
 * Google認証のコールバックを処理するローダー
 * Google認証が完了した後、このルートにリダイレクトされる
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
  
  // Google認証のコールバックを処理
  // 認証が成功した場合は指定されたリダイレクト先に、失敗した場合はログインページにリダイレクトする
  // 認証を試みる
  try {
    // 認証を試みる
    const user = await authenticator.authenticate("google", request);
    
    if (!user || !user.id) {
      throw new Error("ユーザー情報が不完全です");
    }
    
    // 認証が成功した場合、セッションにユーザー情報を保存してリダイレクト
    const session = await getSession(request, sessionStorage);
    session.set("userId", user.id);
    
    // セッションをコミットしてリダイレクト
    const cookie = await sessionStorage.commitSession(session, {
      // セッションの有効期限を明示的に設定（1日）
      maxAge: 60 * 60 * 24
    });
    
    // デバッグ情報（本番環境では削除してください）
    console.log("認証成功 - セッション情報:", {
      userId: user.id,
      cookieLength: cookie.length,
      cookieValue: cookie,
      redirectTo
    });
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    // エラーの詳細をログに出力
    console.error("Google認証エラー:", error);
    
    // エラーメッセージを取得
    let errorMessage = "認証に失敗しました";
    if (error instanceof Error) {
      errorMessage = `認証エラー: ${error.message}`;
    }
    
    // 認証に失敗した場合はログインページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
}

// このページはレンダリングされることはないが、Remixの規約に従って空のコンポーネントを定義
export default function GoogleAuthCallback() {
  return null;
}
