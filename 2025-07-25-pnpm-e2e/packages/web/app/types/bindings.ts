/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers用のBindings型定義
 */
export type Bindings = {
	DB: D1Database;
	ENVIRONMENT?: string;
};

export type Variables = Record<string, unknown>;
