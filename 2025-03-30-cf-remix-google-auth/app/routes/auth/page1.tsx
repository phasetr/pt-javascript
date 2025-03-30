import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { createAuthenticator } from "~/utils/auth.server";
import { createCloudflareSessionStorage } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "認証ページ1 - CRGA" },
    { name: "description", content: "認証が必要なページ1" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  // セッションストレージを作成
  const env = context.env as Record<string, string>;
  const sessionStorage = createCloudflareSessionStorage(env);
  
  // 認証インスタンスを作成
  const authenticator = createAuthenticator(env, sessionStorage);
  
  try {
    // 認証状態をチェック
    const user = await authenticator.authenticate("google", request);
    
    // 認証済みユーザーのデータを返す
    return json({
      user,
      pageData: {
        title: "認証ページ1",
        content: "このページは認証が必要なコンテンツです。ログインしているユーザーのみがアクセスできます。",
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    // 認証されていない場合はログインページにリダイレクト
    const searchParams = new URLSearchParams([
      ["redirectTo", request.url],
    ]);
    return redirect(`/login?${searchParams}`);
  }
}

export default function AuthPage1() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          {data.pageData.title}
        </h1>
        <div className="flex items-center space-x-4">
          <img
            src={data.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0D8ABC&color=fff`}
            alt={data.user.name}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <p className="font-medium text-gray-800 dark:text-white">{data.user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="prose max-w-none dark:prose-invert">
          <p>{data.pageData.content}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            最終更新: {new Date(data.pageData.timestamp).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
        <h2 className="mb-4 text-xl font-semibold text-blue-800 dark:text-blue-300">
          認証済みユーザー情報
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody>
              <tr className="border-b border-blue-100 dark:border-blue-800">
                <th className="py-2 pr-4 font-medium text-blue-700 dark:text-blue-400">ユーザーID</th>
                <td className="py-2 text-gray-800 dark:text-gray-200">{data.user.id}</td>
              </tr>
              <tr className="border-b border-blue-100 dark:border-blue-800">
                <th className="py-2 pr-4 font-medium text-blue-700 dark:text-blue-400">名前</th>
                <td className="py-2 text-gray-800 dark:text-gray-200">{data.user.name}</td>
              </tr>
              <tr>
                <th className="py-2 pr-4 font-medium text-blue-700 dark:text-blue-400">メールアドレス</th>
                <td className="py-2 text-gray-800 dark:text-gray-200">{data.user.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
