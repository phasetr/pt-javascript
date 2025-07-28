/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers用のBindings型定義
 */
export type Bindings = {
	DB: D1Database;
	ENVIRONMENT?: string;
};

import type { Database } from "@pnpm-e2e/core";

export type Variables = {
	db: Database;
};

export type Env = {
	Bindings: Bindings;
	Variables: Variables;
};
