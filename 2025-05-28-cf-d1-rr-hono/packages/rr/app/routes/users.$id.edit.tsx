import { Form, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/users.$id.edit';
import { getUserById, updateUser } from '../lib/db.server';

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = await getUserById(context.cloudflare.env, params.id);
  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }
  return { user };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string | null;

  if (!email) {
    return { error: 'メールアドレスは必須です' };
  }

  try {
    await updateUser(context.cloudflare.env, params.id, { email, name });
    return redirect(`/users/${params.id}`);
  } catch (error) {
    return { error: 'ユーザーの更新に失敗しました' };
  }
}

export default function EditUser() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ユーザー編集</h1>

      <Form method="post" className="max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={user.name || ''}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            更新
          </button>
          <a
            href={`/users/${user.id}`}
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            キャンセル
          </a>
        </div>
      </Form>
    </div>
  );
}