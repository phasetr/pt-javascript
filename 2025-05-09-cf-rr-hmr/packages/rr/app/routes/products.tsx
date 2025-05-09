import type { Product, Route } from "./+types/products";

export function meta() {
  return [
    { title: "商品一覧" },
    { name: "description", content: "D1データベースから商品一覧を表示します" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM products ORDER BY id"
  ).all();

  return { products: results as Product[] };
}

export default function Products({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">商品一覧</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">商品名</th>
              <th className="py-2 px-4 border-b text-left">価格</th>
              <th className="py-2 px-4 border-b text-left">説明</th>
              <th className="py-2 px-4 border-b text-left">作成日時</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{product.id}</td>
                <td className="py-2 px-4 border-b">{product.name}</td>
                <td className="py-2 px-4 border-b">¥{product.price.toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{product.description}</td>
                <td className="py-2 px-4 border-b">{product.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <a href="/users" className="text-blue-500 hover:underline">
          ユーザー一覧を表示
        </a>
      </div>
    </main>
  );
}
