import type { Database } from "@pnpm-e2e/core";

export interface Bindings {
	DB: Database;
	ENVIRONMENT?: string;
}

export interface Variables {
	db: Database; // 統一されたDatabase型
}

export interface Env {
	Bindings: Bindings;
	Variables: Variables;
}
