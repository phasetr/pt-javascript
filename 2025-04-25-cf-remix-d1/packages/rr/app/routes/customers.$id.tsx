import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import { type Customer, customers as customersTable } from "db";
import { eq } from "drizzle-orm";
import { Link, useLoaderData, useParams } from "react-router";
import { createDb } from "~/utils/db";

interface LoaderArgs {
	params: {
		id: string;
	};
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

export async function loader({ params, context }: LoaderArgs) {
	const { DB } = context.cloudflare.env;
	const customerId = Number.parseInt(params.id, 10);

	if (Number.isNaN(customerId)) {
		throw new Response("Invalid customer ID", { status: 400 });
	}

	// drizzle ORMを使用して特定の顧客データを取得
	const db = createDb(DB);
	const customer = await db
		.select()
		.from(customersTable)
		.where(eq(customersTable.CustomerId, customerId))
		.get();

	if (!customer) {
		throw new Response("Customer not found", { status: 404 });
	}

	return { customer };
}

export default function CustomerDetail() {
	const { customer } = useLoaderData<{ customer: Customer }>();
	const params = useParams();

	return (
		<div className="container mx-auto p-4 text-gray-800 dark:text-gray-200">
			<h1 className="text-2xl font-bold mb-4">顧客詳細</h1>

			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
				<div className="mb-4">
					<span className="font-semibold">ID:</span> {customer.CustomerId}
				</div>
				<div className="mb-4">
					<span className="font-semibold">会社名:</span> {customer.CompanyName}
				</div>
				<div className="mb-4">
					<span className="font-semibold">担当者名:</span>{" "}
					{customer.ContactName}
				</div>
			</div>

			<div className="mt-6 flex gap-4">
				<Link
					to={`/customers/${params.id}/edit`}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					編集
				</Link>
				<Link
					to={`/customers/${params.id}/delete`}
					className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					削除
				</Link>
				<Link
					to="/customers"
					className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
				>
					一覧に戻る
				</Link>
			</div>
		</div>
	);
}
