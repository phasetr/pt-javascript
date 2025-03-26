/**
 * ユーザー一覧ページ
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { userRepository } from '~/lib/db';

// ローダー関数
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 注: 実際のアプリケーションでは、すべてのユーザーを取得するのではなく、
    // ページネーションやフィルタリングを実装する必要があります。
    // このエンドポイントはデモ用です。
    
    // 現在の実装では、GSIを使ってすべてのユーザーを取得する方法がないため、
    // ダミーデータを返します。
    const dummyUsers = [
      {
        userId: 'user1',
        name: 'ユーザー1',
        email: 'user1@example.com'
      },
      {
        userId: 'user2',
        name: 'ユーザー2',
        email: 'user2@example.com'
      },
      {
        userId: 'user3',
        name: 'ユーザー3',
        email: 'user3@example.com'
      }
    ];
    
    return json({
      users: dummyUsers,
      environment: process.env.ENVIRONMENT || 'local'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ 
      error: 'Failed to fetch users',
      environment: process.env.ENVIRONMENT || 'local'
    }, { status: 500 });
  }
}

// ユーザー一覧ページコンポーネント
export default function UsersIndex() {
  const data = useLoaderData<typeof loader>();
  
  if ('error' in data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">ユーザー一覧</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{data.error}</p>
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-500 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー一覧</h1>
        <Link 
          to="/users/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          新規ユーザー作成
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メールアドレス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.users.map((user) => (
              <tr key={user.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.userId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link 
                    to={`/users/${user.userId}`} 
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    詳細
                  </Link>
                  <Link 
                    to={`/users/${user.userId}/tasks`} 
                    className="text-green-600 hover:text-green-900"
                  >
                    タスク
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6">
        <Link to="/" className="text-blue-500 hover:underline">
          ホームに戻る
        </Link>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>環境: {data.environment}</p>
      </div>
    </div>
  );
}
