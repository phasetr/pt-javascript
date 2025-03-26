import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "CTLD App" },
    { name: "description", content: "CTLD Application with DynamoDB" },
  ];
};

// 環境情報を取得するローダー関数
export async function loader() {
  const environment = process.env.ENVIRONMENT || 'local';
  return Response.json({
    environment,
    timestamp: new Date().toISOString()
  });
}

export default function Index() {
  const { environment } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen flex-col items-center p-8">
      <header className="flex flex-col items-center gap-6 mb-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
          CTLD アプリケーション
        </h1>
        <div className="h-[144px] w-[434px]">
          <img
            src="/logo-light.png"
            alt="Remix"
            className="block w-full dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Remix"
            className="hidden w-full dark:block"
          />
          <h2 className="text-center font-bold text-2xl text-blue-500">環境: {environment}</h2>
        </div>
      </header>
      
      <main className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ユーザー管理カード */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">ユーザー管理</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ユーザーの作成、編集、削除を行います。
              </p>
              <Link 
                to="/users" 
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded"
              >
                ユーザー一覧を表示
              </Link>
            </div>
          </div>
          
          {/* タスク管理カード */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">タスク管理</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ユーザーごとのタスクを管理します。
              </p>
              <Link 
                to="/users" 
                className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 px-4 rounded"
              >
                ユーザーを選択してタスクを管理
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">アプリケーション情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">技術スタック</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2">
                  <li>フロントエンド: Remix</li>
                  <li>バックエンド: AWS Lambda</li>
                  <li>API: Hono</li>
                  <li>データベース: DynamoDB</li>
                  <li>インフラ: AWS CDK</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">環境情報</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2">
                  <li>現在の環境: {environment}</li>
                  <li>タイムスタンプ: {new Date().toLocaleString()}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 CTLD Application</p>
      </footer>
    </div>
  );
}
