import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "テストページ - CRGA" },
    { name: "description", content: "認証なしでアクセスできるテストページ" },
  ];
};

export default function TestPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          テストページ
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          このページは認証なしでアクセスできるテストページです。
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="prose max-w-none dark:prose-invert">
          <p>
            このページが表示されていれば、ルーティングは正常に機能しています。
          </p>
          <p>
            現在の時刻: {new Date().toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
