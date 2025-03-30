import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "認証ページ1 - CRGA" },
    { name: "description", content: "認証が必要なページ1" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // ここで認証状態をチェックし、認証されていない場合はリダイレクト
  // 現段階では実装しないため、認証されているものとして扱う
  // ステップ3で実装予定

  // 認証済みユーザーのデータを返す（仮のデータ）
  return Response.json({
    user: {
      id: "user_123",
      name: "テストユーザー",
      email: "test@example.com",
      avatarUrl: "https://ui-avatars.com/api/?name=テスト+ユーザー&background=0D8ABC&color=fff",
    },
    pageData: {
      title: "認証ページ1",
      content: "このページは認証が必要なコンテンツです。ログインしているユーザーのみがアクセスできます。",
      timestamp: new Date().toISOString(),
    }
  });
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
            src={data.user.avatarUrl}
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
