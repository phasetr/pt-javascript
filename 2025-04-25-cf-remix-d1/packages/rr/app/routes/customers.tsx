import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import { Link, useLoaderData } from "react-router";
import { type Customer, createDb, customers as customersTable } from "db";

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

	// drizzle ORMを使用してデータを取得
	const db = createDb(DB);
	const customers = await db
		.select()
		.from(customersTable)
		.orderBy(customersTable.CustomerId);

	return { customers };
}

export default function Customers() {
	const { customers } = useLoaderData<{ customers: Customer[] }>();

	return (
		<div className="container mx-auto p-4 text-gray-800 dark:text-gray-200">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">顧客一覧</h1>
				<Link
					to="/customers/new"
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					新規登録
				</Link>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
					<thead>
						<tr className="bg-gray-100 dark:bg-gray-700">
							<th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left">
								ID
							</th>
							<th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left">
								会社名
							</th>
							<th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left">
								担当者名
							</th>
							<th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-left">
								操作
							</th>
						</tr>
					</thead>
					<tbody>
						{customers.map((customer) => (
							<tr
								key={customer.CustomerId}
								className="hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								<td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
									{customer.CustomerId}
								</td>
								<td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
									<Link
										to={`/customers/${customer.CustomerId}`}
										className="text-blue-500 hover:underline"
									>
										{customer.CompanyName}
									</Link>
								</td>
								<td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
									{customer.ContactName}
								</td>
								<td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
									<div className="flex gap-2">
										<Link
											to={`/customers/${customer.CustomerId}`}
											className="text-blue-500 hover:underline"
										>
											詳細
										</Link>
										<Link
											to={`/customers/${customer.CustomerId}/edit`}
											className="text-green-500 hover:underline"
										>
											編集
										</Link>
										<Link
											to={`/customers/${customer.CustomerId}/delete`}
											className="text-red-500 hover:underline"
										>
											削除
										</Link>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="mt-4">
				<a
					href="/"
					className="text-blue-500 dark:text-blue-400 hover:underline"
				>
					ホームに戻る
				</a>
			</div>
		</div>
	);
}
