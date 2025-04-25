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
	errors?: {
		companyName?: string;
		contactName?: string;
		general?: string;
	};
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
	
	const companyName = formData.get("companyName")?.toString().trim() || "";
	const contactName = formData.get("contactName")?.toString().trim() || "";
	
	const errors: ActionData["errors"] = {};
	
	if (!companyName) {
		errors.companyName = "会社名は必須です";
	}
	
	if (!contactName) {
		errors.contactName = "担当者名は必須です";
	}
	
	if (Object.keys(errors).length > 0) {
		return { errors };
	}
	
	try {
		const db = createDb(DB);
		
		// 顧客情報を更新
		await db
			.update(customersTable)
			.set({
				CompanyName: companyName,
				ContactName: contactName,
			})
			.where(eq(customersTable.CustomerId, customerId));
		
		// 成功したら顧客詳細ページにリダイレクト
		return redirect(`/customers/${customerId}`);
	} catch (error) {
		console.error("Error updating customer:", error);
		return {
			errors: {
				general: "顧客の更新中にエラーが発生しました。もう一度お試しください。",
			},
		};
	}
}

export default function CustomerEdit() {
	const { customer } = useLoaderData<{ customer: Customer }>();
	const actionData = useActionData<ActionData>();
	
	return (
		<div className="container mx-auto p-4 text-gray-800 dark:text-gray-200">
			<h1 className="text-2xl font-bold mb-4">顧客情報編集</h1>
			
			{actionData?.errors?.general && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{actionData.errors.general}
				</div>
			)}
			
			<Form method="post" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
				<div className="mb-4">
					<label htmlFor="customerId" className="block mb-2 font-medium">
						顧客ID
					</label>
					<input
						type="text"
						id="customerId"
						name="customerId"
						value={customer.CustomerId}
						readOnly
						className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-600 dark:border-gray-600"
					/>
				</div>
				
				<div className="mb-4">
					<label htmlFor="companyName" className="block mb-2 font-medium">
						会社名
					</label>
					<input
						type="text"
						id="companyName"
						name="companyName"
						defaultValue={customer.CompanyName}
						className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
					/>
					{actionData?.errors?.companyName && (
						<p className="text-red-500 mt-1">{actionData.errors.companyName}</p>
					)}
				</div>
				
				<div className="mb-4">
					<label htmlFor="contactName" className="block mb-2 font-medium">
						担当者名
					</label>
					<input
						type="text"
						id="contactName"
						name="contactName"
						defaultValue={customer.ContactName}
						className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
					/>
					{actionData?.errors?.contactName && (
						<p className="text-red-500 mt-1">{actionData.errors.contactName}</p>
					)}
				</div>
				
				<div className="flex gap-4 mt-6">
					<button
						type="submit"
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						更新
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
