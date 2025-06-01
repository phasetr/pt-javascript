import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/users';
import { getAllUsers } from '../lib/db.server';

export async function loader({ context }: Route.LoaderArgs) {
  const users = await getAllUsers(context.cloudflare.env);
  return { users };
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
        <Link
          to="/users/new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          新規ユーザー作成
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500">ユーザーが登録されていません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">メール</th>
                <th className="py-2 px-4 border-b">名前</th>
                <th className="py-2 px-4 border-b">作成日時</th>
                <th className="py-2 px-4 border-b">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b font-mono text-sm">{user.id}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.name || '-'}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(user.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link
                      to={`/users/${user.id}/edit`}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      編集
                    </Link>
                    <Link
                      to={`/users/${user.id}`}
                      className="text-green-500 hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}