import { Link, useLoaderData, Form, redirect } from 'react-router';
import type { Route } from './+types/users.$id';
import { getUserById, deleteUser } from '../lib/db.server';

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = await getUserById(context.cloudflare.env, params.id);
  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }
  return { user };
}

export async function action({ params, context }: Route.ActionArgs) {
  await deleteUser(context.cloudflare.env, params.id);
  return redirect('/users');
}

export default function UserDetail() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ユーザー詳細</h1>
        <Link
          to="/users"
          className="text-blue-500 hover:underline"
        >
          一覧に戻る
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            ユーザー情報
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                {user.id}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.email}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">名前</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.name || '-'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">作成日時</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">更新日時</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.updatedAt).toLocaleString('ja-JP')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <Link
          to={`/users/${user.id}/edit`}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          編集
        </Link>
        <Form method="post">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={(e) => {
              if (!confirm('本当に削除しますか？')) {
                e.preventDefault();
              }
            }}
          >
            削除
          </button>
        </Form>
      </div>
    </div>
  );
}