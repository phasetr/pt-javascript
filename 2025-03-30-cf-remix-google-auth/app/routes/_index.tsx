import type { MetaFunction } from "@remix-run/cloudflare";
import { Form, Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "CRGA - Cloudflare Remix Google Auth" },
    { name: "description", content: "Cloudflare Remix with Google Authentication" },
  ];
};

export default function Index() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          Cloudflare Remix Google Auth
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Cloudflare上のRemixでGoogle認証を確認するプロジェクト
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            ログイン
          </h2>
          <Form method="post" action="/login" className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                ログイン
              </button>
            </div>
          </Form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">または</p>
            <Link
              to="/auth/google"
              className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-labelledby="googleIconTitle">
                <title id="googleIconTitle">Google logo</title>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Googleでログイン
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            認証が必要なページ
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            以下のページにアクセスするには認証が必要です。
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                to="/auth/page1"
                className="block rounded-md bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                認証ページ1
              </Link>
            </li>
            <li>
              <Link
                to="/auth/page2"
                className="block rounded-md bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                認証ページ2
              </Link>
            </li>
            <li className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Link
                to="/test"
                className="block rounded-md bg-green-100 p-3 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
              >
                テストページ（認証なし）
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
