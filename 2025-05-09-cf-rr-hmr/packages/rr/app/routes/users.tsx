import type { Route, User } from "./+types/users";

export function meta() {
  return [
    { title: "ユーザー一覧" },
    { name: "description", content: "D1データベースからユーザー一覧を表示します" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM users ORDER BY id"
  ).all();

  return { users: results as User[] };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">ユーザー一覧</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">名前</th>
              <th className="py-2 px-4 border-b text-left">メールアドレス</th>
              <th className="py-2 px-4 border-b text-left">作成日時</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{user.id}</td>
                <td className="py-2 px-4 border-b">{user.name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <a href="/products" className="text-blue-500 hover:underline">
          商品一覧を表示
        </a>
      </div>
    </main>
  );
}
