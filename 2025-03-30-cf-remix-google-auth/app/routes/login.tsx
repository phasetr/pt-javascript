import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "ログイン - CRGA" },
    { name: "description", content: "ログインページ" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  // セッションストレージを作成
  const env = context.env as Record<string, string>;
  const sessionStorage = createCloudflareSessionStorage(env);

  // 認証インスタンスを作成
  const authenticator = createAuthenticator(sessionStorage, env);

  // 現在のユーザーを取得
  try {
    // すでにログインしている場合はホームページにリダイレクト
    const user = await authenticator.authenticate("google", request);
    if (user) {
      // リダイレクト先を取得
      const url = new URL(request.url);
      const redirectTo = url.searchParams.get("redirectTo") || "/";
      return redirect(redirectTo);
    }
  } catch (error) {
    // 認証エラーの場合は何もしない
  }

  // URLからエラーメッセージを取得
  const url = new URL(request.url);
  const errorMessage = url.searchParams.get("error");

  return Response.json({ errorMessage });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // バリデーション
  const errors: { email?: string; password?: string; form?: string } = {};

  if (!email || typeof email !== "string") {
    errors.email = "メールアドレスを入力してください";
  } else if (!email.includes("@")) {
    errors.email = "有効なメールアドレスを入力してください";
  }

  if (!password || typeof password !== "string") {
    errors.password = "パスワードを入力してください";
  } else if (password.length < 6) {
    errors.password = "パスワードは6文字以上である必要があります";
  }

  // エラーがある場合は早期リターン
  if (Object.keys(errors).length > 0) {
    return json({ errors, fields: { email: typeof email === "string" ? email : "" } }, { status: 400 });
  }

  // 認証ロジック（実際の実装はステップ3で行う）
  // 現段階では、単純にエラーを返す
  errors.form = "メール/パスワード認証は実装されていません。Googleログインをご利用ください。";
  return json({ errors, fields: { email: typeof email === "string" ? email : "" } }, { status: 400 });
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
          ログイン
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          アカウント情報を入力してログインしてください
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        {loaderData.errorMessage ? (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">認証エラー</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>{loaderData.errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {actionData?.errors?.form ? (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">
              {actionData.errors.form}
            </p>
          </div>
        ) : null}

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={actionData?.fields?.email || ""}
              className={`w-full rounded-md border ${actionData?.errors?.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } px-3 py-2 focus:outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              aria-invalid={Boolean(actionData?.errors?.email)}
              aria-errormessage={actionData?.errors?.email ? "email-error" : undefined}
              disabled={isSubmitting}
              required
            />
            {actionData?.errors?.email ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="email-error">
                {actionData.errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`w-full rounded-md border ${actionData?.errors?.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } px-3 py-2 focus:outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
              aria-invalid={Boolean(actionData?.errors?.password)}
              aria-errormessage={actionData?.errors?.password ? "password-error" : undefined}
              disabled={isSubmitting}
              required
            />
            {actionData?.errors?.password ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="password-error">
                {actionData.errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">または</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to={`/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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
      </div>
    </div>
  );
}
