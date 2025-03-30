import { createCookieSessionStorage } from "@remix-run/cloudflare";
import type { SessionStorage } from "@remix-run/cloudflare";

// セッションの有効期限（1日）
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24;

// セッションストレージの作成
export function createCloudflareSessionStorage(
  env: Record<string, string>
): SessionStorage {
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET || "s3cr3t"],
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_EXPIRATION_TIME / 1000, // セッションの有効期限（秒単位）
    },
  });
}

// セッションからユーザーIDを取得
export async function getUserId(
  request: Request,
  sessionStorage: SessionStorage
): Promise<string | null> {
  const session = await getSession(request, sessionStorage);
  const userId = session.get("userId");
  return userId ? String(userId) : null;
}

// リクエストからセッションを取得
export async function getSession(
  request: Request,
  sessionStorage: SessionStorage
) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

// ユーザーIDをセッションに保存してレスポンスを返す
export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
  sessionStorage,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
  sessionStorage: SessionStorage;
}) {
  const session = await getSession(request, sessionStorage);
  session.set("userId", userId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember
          ? SESSION_EXPIRATION_TIME / 1000
          : undefined,
      }),
    },
  });
}

// ログアウト処理
export async function logout({
  request,
  redirectTo = "/",
  sessionStorage,
}: {
  request: Request;
  redirectTo?: string;
  sessionStorage: SessionStorage;
}) {
  const session = await getSession(request, sessionStorage);
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

// ユーザーがログインしているか確認
export async function requireUserId(
  request: Request,
  sessionStorage: SessionStorage,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request, sessionStorage);
  if (!userId) {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
    ]);
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/login?${searchParams}`,
      },
    });
  }
  return userId;
}
