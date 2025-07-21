import { useLoaderData } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { users } from "../db/schema";
import type { InferSelectModel } from "drizzle-orm";

export function meta() {
  return [
    { title: "Users" },
    { name: "description", content: "Displays a list of users" },
  ];
}

interface LoaderArgs {
  context: {
    cloudflare: {
      env: {
        DB: D1Database;
      };
    };
  };
}

export async function loader({ context }: LoaderArgs) {
  const env = context.cloudflare.env;
  const db = drizzle(env.DB);

  try {
    const allUsers = await db.select().from(users).all();
    return { users: allUsers };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { users: [] };
  }
}

type User = InferSelectModel<typeof users>;

export default function Index() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: User) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
