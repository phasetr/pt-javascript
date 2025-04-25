import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";
import { Form, useActionData, useNavigate, Link } from "react-router";
import { type NewCustomer, createDb, customers as customersTable } from "~/db";

interface ActionArgs {
	request: Request;
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

interface ActionData {
	errors?: {
		companyName?: string;
		contactName?: string;
		general?: string;
	};
	success?: boolean;
}

export async function action({ request, context }: ActionArgs) {
	const { DB } = context.cloudflare.env;
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
		
		// 最大のCustomerIdを取得して新しいIDを生成
		const result = await db
			.select({ maxId: customersTable.CustomerId })
			.from(customersTable)
			.orderBy(customersTable.CustomerId)
			.all();
		
		const maxId = result.length > 0 ? Math.max(...result.map(r => r.maxId)) : 0;
		const newCustomerId = maxId + 1;
		
		// 新しい顧客を挿入
		const newCustomer: NewCustomer = {
			CustomerId: newCustomerId,
			CompanyName: companyName,
			ContactName: contactName,
		};
		
		await db.insert(customersTable).values(newCustomer);
		
		return { success: true };
	} catch (error) {
		console.error("Error creating customer:", error);
		return {
			errors: {
				general: "顧客の作成中にエラーが発生しました。もう一度お試しください。",
			},
		};
	}
}

export default function CustomerNew() {
	const actionData = useActionData<ActionData>();
	const navigate = useNavigate();
	
	// 成功したら顧客一覧ページにリダイレクト
	if (actionData?.success) {
		navigate("/customers");
		return null;
	}
	
	return (
		<div className="container mx-auto p-4 text-gray-800 dark:text-gray-200">
			<h1 className="text-2xl font-bold mb-4">新規顧客登録</h1>
			
			{actionData?.errors?.general && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{actionData.errors.general}
				</div>
			)}
			
			<Form method="post" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
				<div className="mb-4">
					<label htmlFor="companyName" className="block mb-2 font-medium">
						会社名
					</label>
					<input
						type="text"
						id="companyName"
						name="companyName"
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
						className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
					/>
					{actionData?.errors?.contactName && (
						<p className="text-red-500 mt-1">{actionData.errors.contactName}</p>
					)}
				</div>
				
				<div className="flex gap-4 mt-6">
					<button
						type="submit"
						className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
					>
						登録
					</button>
					<Link
						to="/customers"
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
					>
						キャンセル
					</Link>
				</div>
			</Form>
		</div>
	);
}
