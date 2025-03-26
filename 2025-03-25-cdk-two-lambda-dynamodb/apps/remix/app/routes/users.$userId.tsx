/**
 * ユーザー詳細ページ
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { userRepository } from '~/lib/db';

// ローダー関数
export async function loader({ params }: LoaderFunctionArgs) {
  const userId = params.userId;
  
  if (!userId) {
    return json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    // ユーザーを取得
    const user = await userRepository.getUser(userId);
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    return json({
      user,
      environment: process.env.ENVIRONMENT || 'local'
    });
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return json({ 
      error: 'Failed to fetch user',
      environment: process.env.ENVIRONMENT || 'local'
    }, { status: 500 });
  }
}

// ユーザー詳細ページコンポーネント
export default function UserDetail() {
  const data = useLoaderData<typeof loader>();
  
  if ('error' in data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">ユーザー詳細</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{data.error}</p>
        </div>
        <div className="mt-4">
          <Link to="/users" className="text-blue-500 hover:underline">
            ユーザー一覧に戻る
          </Link>
        </div>
      </div>
    );
  }
  
  const { user } = data;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">ユーザー詳細</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-gray-600">ユーザーID:</div>
          <div>{user.userId}</div>
          
          <div className="text-gray-600">名前:</div>
          <div>{user.name}</div>
          
          <div className="text-gray-600">メールアドレス:</div>
          <div>{user.email}</div>
          
          <div className="text-gray-600">作成日時:</div>
          <div>{new Date(user.createdAt).toLocaleString()}</div>
          
          <div className="text-gray-600">更新日時:</div>
          <div>{new Date(user.updatedAt).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <Link 
          to={`/users/${user.userId}/edit`} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          編集
        </Link>
        
        <Link 
          to={`/users/${user.userId}/tasks`} 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          タスク一覧
        </Link>
      </div>
      
      <div className="mt-6">
        <Link to="/users" className="text-blue-500 hover:underline">
          ユーザー一覧に戻る
        </Link>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>環境: {data.environment}</p>
      </div>
    </div>
  );
}
