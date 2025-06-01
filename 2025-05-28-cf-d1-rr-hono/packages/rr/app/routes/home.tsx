import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "D1 CRUD Demo" },
    { name: "description", content: "Cloudflare D1 CRUD Demo with React Router" },
  ];
}

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">ローカルD1データベース CRUD デモ</h1>
      <p className="text-lg mb-8">
        このデモは、React RouterからCloudflare D1データベースへのアクセスを示しています。
        プロジェクトルートの<code className="bg-gray-200 px-2 py-1 rounded">.wrangler-persist</code>
        ディレクトリにデータベースファイルが保存されます。
      </p>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">機能</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>ユーザーの一覧表示</li>
          <li>新規ユーザーの作成</li>
          <li>ユーザー情報の詳細表示</li>
          <li>ユーザー情報の編集</li>
          <li>ユーザーの削除</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <Link
          to="/users"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg"
        >
          ユーザー管理へ
        </Link>
      </div>
    </div>
  );
}
