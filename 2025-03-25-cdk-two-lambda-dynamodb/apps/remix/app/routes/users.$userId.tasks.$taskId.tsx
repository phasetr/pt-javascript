/**
 * タスク詳細ページ
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { userRepository, taskRepository } from '~/lib/db';

// ローダー関数
export async function loader({ params }: LoaderFunctionArgs) {
  const userId = params.userId;
  const taskId = params.taskId;
  
  if (!userId || !taskId) {
    return json({ error: 'User ID and Task ID are required' }, { status: 400 });
  }
  
  try {
    // ユーザーを取得
    const user = await userRepository.getUser(userId);
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    // タスクを取得
    const task = await taskRepository.getTask(userId, taskId);
    
    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }
    
    return json({
      user,
      task,
      environment: process.env.ENVIRONMENT || 'local'
    });
  } catch (error) {
    console.error(`Error fetching task ${taskId} for user ${userId}:`, error);
    return json({ 
      error: 'Failed to fetch task',
      environment: process.env.ENVIRONMENT || 'local'
    }, { status: 500 });
  }
}

// タスク詳細ページコンポーネント
export default function TaskDetail() {
  const data = useLoaderData<typeof loader>();
  
  if ('error' in data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">タスク詳細</h1>
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
  
  const { user, task } = data;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">タスク詳細</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-gray-600">タイトル:</div>
          <div>{task.title}</div>
          
          <div className="text-gray-600">説明:</div>
          <div>{task.description || '-'}</div>
          
          <div className="text-gray-600">ステータス:</div>
          <div>{task.status}</div>
          
          <div className="text-gray-600">期限:</div>
          <div>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</div>
          
          <div className="text-gray-600">作成日時:</div>
          <div>{new Date(task.createdAt).toLocaleString()}</div>
          
          <div className="text-gray-600">更新日時:</div>
          <div>{new Date(task.updatedAt).toLocaleString()}</div>
          
          <div className="text-gray-600">ユーザー:</div>
          <div>
            <Link to={`/users/${user.userId}`} className="text-blue-500 hover:underline">
              {user.name}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <Link 
          to={`/users/${user.userId}/tasks/${task.taskId}/edit`} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          編集
        </Link>
        
        <Link 
          to={`/users/${user.userId}/tasks/${task.taskId}/delete`} 
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          削除
        </Link>
      </div>
      
      <div className="mt-6">
        <Link to={`/users/${user.userId}/tasks`} className="text-blue-500 hover:underline mr-4">
          タスク一覧に戻る
        </Link>
        <Link to={`/users/${user.userId}`} className="text-blue-500 hover:underline">
          ユーザー詳細に戻る
        </Link>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>環境: {data.environment}</p>
      </div>
    </div>
  );
}
