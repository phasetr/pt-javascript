import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export async function loader({ request }: LoaderFunctionArgs) {
  // ログアウト処理はPOSTリクエストで行うべきなので、GETリクエストの場合はホームページにリダイレクト
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  // ログアウト処理（ステップ3で実装予定）
  // 現段階では単純にホームページにリダイレクト
  return redirect("/");
}

// このページはレンダリングされることはないが、Remixの規約に従って空のコンポーネントを定義
export default function Logout() {
  return null;
}
