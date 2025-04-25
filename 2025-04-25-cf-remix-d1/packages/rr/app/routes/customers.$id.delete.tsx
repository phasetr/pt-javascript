import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import { Form, useActionData, useLoaderData, Link } from "react-router";
import { redirect } from "react-router";
import { type Customer, createDb, customers as customersTable } from "~/db";
import { eq } from "drizzle-orm";

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

interface ActionArgs extends LoaderArgs {
	request: Request;
}

interface ActionData {
	error?: string;
	success?: boolean;
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

export async function action({ params, request, context }: ActionArgs) {
	const { DB } = context.cloudflare.env;
	const customerId = Number.parseInt(params.id, 10);

	if (Number.isNaN(customerId)) {
		throw new Response("Invalid customer ID", { status: 400 });
	}

	const formData = await request.formData();
	const confirmation = formData.get("confirmation");
	
	if (confirmation !== "delete") {
		return { error: "削除を確認するには「delete」と入力してください。" };
	}
	
	try {
		const db = createDb(DB);
		
		// 顧客を削除
		await db
			.delete(customersTable)
			.where(eq(customersTable.CustomerId, customerId));
		
		// 成功したら顧客一覧ページにリダイレクト
		return redirect("/customers");
	} catch (error) {
		console.error("Error deleting customer:", error);
		return {
			error: "顧客の削除中にエラーが発生しました。もう一度お試しください。",
		};
	}
}

export default function CustomerDelete() {
	const { customer } = useLoaderData<{ customer: Customer }>();
	const actionData = useActionData<ActionData>();
	
	return (
		<div className="container mx-auto p-4 text-gray-800 dark:text-gray-200">
			<h1 className="text-2xl font-bold mb-4">顧客削除</h1>
			
			<div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-400 text-yellow-800 dark:text-yellow-200 p-4 rounded mb-6">
				<p className="font-bold">警告: この操作は取り消せません。</p>
				<p>顧客ID: {customer.CustomerId} の情報を完全に削除します。</p>
			</div>
			
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
				<h2 className="text-xl font-semibold mb-4">削除する顧客情報</h2>
				<div className="mb-2">
					<span className="font-semibold">ID:</span> {customer.CustomerId}
				</div>
				<div className="mb-2">
					<span className="font-semibold">会社名:</span> {customer.CompanyName}
				</div>
				<div className="mb-2">
					<span className="font-semibold">担当者名:</span> {customer.ContactName}
				</div>
			</div>
			
			{actionData?.error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{actionData.error}
				</div>
			)}
			
			<Form method="post" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
				<div className="mb-4">
					<label htmlFor="confirmation" className="block mb-2 font-medium">
						削除を確認するには「delete」と入力してください
					</label>
					<input
						type="text"
						id="confirmation"
						name="confirmation"
						className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
						placeholder="delete"
					/>
				</div>
				
				<div className="flex gap-4 mt-6">
					<button
						type="submit"
						className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
					>
						削除する
					</button>
					<Link
						to={`/customers/${customer.CustomerId}`}
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
					>
						キャンセル
					</Link>
				</div>
			</Form>
		</div>
	);
}
