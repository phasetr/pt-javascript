import { redirect } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

/**
 * /auth URLにアクセスした場合、/auth/page1 にリダイレクトする
 */
export async function loader({ request }: LoaderFunctionArgs) {
  return redirect("/auth/page1");
}

export default function AuthIndex() {
  return null;
}
