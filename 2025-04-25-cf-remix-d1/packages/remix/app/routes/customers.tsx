import { useLoaderData } from "react-router";

interface Customer {
  CustomerId: number;
  CompanyName: string;
  ContactName: string;
}

interface LoaderArgs {
  context: {
    cloudflare: {
      env: {
        DB: D1Database;
        [key: string]: unknown;
      };
      ctx: ExecutionContext;
    };
  };
}

export async function loader({ context }: LoaderArgs) {
  const { DB } = context.cloudflare.env;
  
  // D1データベースからCustomersテーブルのデータを取得
  const { results } = await DB.prepare(
    "SELECT * FROM Customers ORDER BY CustomerId"
  ).all();
  
  // 型安全に変換
  const customers = results.map(row => ({
    CustomerId: row.CustomerId as number,
    CompanyName: row.CompanyName as string,
    ContactName: row.ContactName as string
  }));
  
  return { customers };
}

export default function Customers() {
  const { customers } = useLoaderData<{ customers: Customer[] }>();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">顧客一覧</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">会社名</th>
              <th className="py-2 px-4 border-b text-left">担当者名</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.CustomerId} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{customer.CustomerId}</td>
                <td className="py-2 px-4 border-b">{customer.CompanyName}</td>
                <td className="py-2 px-4 border-b">{customer.ContactName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <a 
          href="/" 
          className="text-blue-500 hover:underline"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}
