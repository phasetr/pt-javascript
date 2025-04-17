import type { Context, MiddlewareHandler, Next } from "hono";

/**
 * アプリケーションで使用する環境変数の型定義
 */
export type AppEnvVars = {
	SERVICE_URL: string;
	OPENAI_API_KEY: string;
	ENVIRONMENT: string;
	CLOUDFLARE: string;
	// 必要に応じて他の環境変数を追加
	[key: string]: string | undefined;
};

/**
 * 環境変数をコンテキストに追加するための型拡張
 */
declare module "hono" {
	interface ContextVariableMap {
		envVars: AppEnvVars;
	}
}

/**
 * Cloudflare Workers環境用の環境変数ミドルウェア
 * c.envから環境変数を取得し、コンテキストにセットする
 */
export const cloudflareEnvMiddleware: MiddlewareHandler<{
	Bindings: Record<string, string | undefined>;
}> = async (c, next) => {
	const envVars: AppEnvVars = {
		SERVICE_URL: c.env.SERVICE_URL || "",
		OPENAI_API_KEY: c.env.OPENAI_API_KEY || "",
		ENVIRONMENT: c.env.ENVIRONMENT || "development",
		CLOUDFLARE: c.env.CLOUDFLARE || "true", // Cloudflare環境ではデフォルトでtrue
		// 必要に応じて他の環境変数を追加
	};

	// コンテキストに環境変数をセット
	c.set("envVars", envVars);
	await next();
};

/**
 * Node.js環境用の環境変数ミドルウェア
 * process.envから環境変数を取得し、コンテキストにセットする
 */
export const nodeEnvMiddleware = async (c: Context, next: Next) => {
	const envVars: AppEnvVars = {
		SERVICE_URL: process.env.SERVICE_URL || "",
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		ENVIRONMENT: process.env.ENVIRONMENT || "development",
		CLOUDFLARE: process.env.CLOUDFLARE || "false", // Node.js環境ではデフォルトでfalse
		// 必要に応じて他の環境変数を追加
	};

	// コンテキストに環境変数をセット
	c.set("envVars", envVars);
	await next();
};
