/**
 * ユーザーのタスク一覧ページ
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { userRepository, taskRepository } from '~/lib/db';
import { TaskStatus } from '@ctld/db-lib';

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
    
    // ユーザーのタスクを取得
    const tasks = await taskRepository.listTasksByUser(userId);
    
    return json({
      user,
      tasks,
      environment: process.env.ENVIRONMENT || 'local'
    });
  } catch (error) {
    console.error(`Error fetching tasks for user ${userId}:`, error);
    return json({ 
      error: 'Failed to fetch tasks',
      environment: process.env.ENVIRONMENT || 'local'
    }, { status: 500 });
  }
}

// タスクのステータスに応じたバッジを表示するコンポーネント
function StatusBadge({ status }: { status: TaskStatus }) {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case TaskStatus.TODO:
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case TaskStatus.IN_PROGRESS:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case TaskStatus.DONE:
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
}

// ユーザーのタスク一覧ページコンポーネント
export default function UserTasks() {
  const data = useLoaderData<typeof loader>();
  
  if ('error' in data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">ユーザーのタスク一覧</h1>
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
  
  const { user, tasks } = data;
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{user.name} のタスク一覧</h1>
        <Link 
          to={`/users/${user.userId}/tasks/new`} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          新規タスク作成
        </Link>
      </div>
      
      {tasks.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">タスクがありません</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  期限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.taskId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      to={`/users/${user.userId}/tasks/${task.taskId}`} 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      詳細
                    </Link>
                    <Link 
                      to={`/users/${user.userId}/tasks/${task.taskId}/edit`} 
                      className="text-green-600 hover:text-green-900"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6">
        <Link to={`/users/${user.userId}`} className="text-blue-500 hover:underline mr-4">
          ユーザー詳細に戻る
        </Link>
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
