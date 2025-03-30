import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "ページ2 - Remix App" },
    { name: "description", content: "ページ2の説明" },
  ];
};

export default function Page2() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          ページ2
        </h1>
        
        <p className="text-gray-700 dark:text-gray-300 max-w-md text-center">
          これはBasic認証で保護されたページ2です。このページから他のページに移動したり、認証を解除したりできます。
        </p>
        
        <nav className="flex flex-col gap-4 w-full">
          <Link 
            to="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
          >
            ホームに戻る
          </Link>
          
          <Link 
            to="/page1"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
          >
            ページ1へ移動
          </Link>
          
          <a 
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-center"
            onClick={(e) => {
              // 新しいタブで開くことで、Basic認証のキャッシュをリセットする試み
              window.open('/', '_blank', 'noreferrer');
              e.preventDefault();
            }}
          >
            Basic認証を解除（新しいタブで開く）
          </a>
        </nav>
      </div>
    </div>
  );
}
