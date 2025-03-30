import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // ログアウト処理はPOSTリクエストで行うべきなので、GETリクエストの場合はホームページにリダイレクト
  return redirect("/");
}

export async function action({ request, context }: ActionFunctionArgs) {
  // セッションストレージを作成
  const env = context.env as Record<string, string>;
  const sessionStorage = createCloudflareSessionStorage(env);
  
  // セッションを取得して破棄
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  
  // リダイレクト先を取得
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";
  
  // セッションを破棄してリダイレクト
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

// このページはレンダリングされることはないが、Remixの規約に従って空のコンポーネントを定義
export default function Logout() {
  return null;
}
