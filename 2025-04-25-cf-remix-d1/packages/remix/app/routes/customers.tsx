import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import { useLoaderData } from "react-router";
import { type Customer, createDb, customers as customersTable } from "~/db";

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
			<h1 className="text-2xl font-bold mb-4">顧客一覧</h1>

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
									{customer.CompanyName}
								</td>
								<td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
									{customer.ContactName}
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
