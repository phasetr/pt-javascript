/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers用のBindings型定義
 */
export type Bindings = {
	DB: D1Database;
	ENVIRONMENT?: string;
};

export type Variables = {
	user?: {
		id: string;
		email: string;
		name: string;
		user_type: string;
		company_id: string;
	};
};
