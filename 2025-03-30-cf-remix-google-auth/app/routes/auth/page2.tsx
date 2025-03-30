import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "認証ページ2 - CRGA" },
    { name: "description", content: "認証が必要なページ2" },
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
    stats: [
      { label: "プロジェクト数", value: 12 },
      { label: "完了タスク", value: 42 },
      { label: "進行中タスク", value: 8 },
      { label: "チームメンバー", value: 5 },
    ],
    recentActivities: [
      {
        id: "act1",
        title: "プロジェクトXを作成",
        date: "2025-03-29T10:30:00Z",
        type: "create"
      },
      {
        id: "act2",
        title: "タスクYを完了",
        date: "2025-03-28T15:45:00Z",
        type: "complete"
      },
      {
        id: "act3",
        title: "新しいメンバーを招待",
        date: "2025-03-27T09:15:00Z",
        type: "invite"
      }
    ]
  });
}

export default function AuthPage2() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          ダッシュボード
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          こんにちは、{data.user.name}さん。あなたのアクティビティの概要です。
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          最近のアクティビティ
        </h2>
        <div className="space-y-4">
          {data.recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 rounded-md border border-gray-100 p-4 dark:border-gray-700"
            >
              <div className={`
                flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
                ${activity.type === 'create' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                ${activity.type === 'complete' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
                ${activity.type === 'invite' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : ''}
              `}>
                {activity.type === 'create' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-labelledby="createIconTitle">
                    <title id="createIconTitle">作成アイコン</title>
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
                {activity.type === 'complete' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-labelledby="completeIconTitle">
                    <title id="completeIconTitle">完了アイコン</title>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {activity.type === 'invite' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-labelledby="inviteIconTitle">
                    <title id="inviteIconTitle">招待アイコン</title>
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(activity.date).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
