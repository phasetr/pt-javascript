import { Form, redirect } from 'react-router';
import type { Route } from './+types/users.new';
import { createUser } from '../lib/db.server';

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string | null;

  if (!email) {
    return { error: 'メールアドレスは必須です' };
  }

  try {
    await createUser(context.cloudflare.env, { email, name });
    return redirect('/users');
  } catch (error) {
    return { error: 'ユーザーの作成に失敗しました' };
  }
}

export default function NewUser() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">新規ユーザー作成</h1>

      <Form method="post" className="max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            作成
          </button>
          <a
            href="/users"
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            キャンセル
          </a>
        </div>
      </Form>
    </div>
  );
}