/**
 * ルートエンドポイントのハンドラー
 */
import type { Context } from "hono";

/**
 * ルートエンドポイントのハンドラー関数
 * APIの基本情報と利用可能なエンドポイントの一覧を返します
 * 環境変数CLOUDFLAREの値に基づいて実行環境を判定し、メッセージを切り替えます
 */
export const rootHandler = (c: Context) => {
	// 環境変数からCloudflare環境かどうかを判定
	// .dev.varsまたは.envファイルのCLOUDFLARE環境変数を使用
	const envVars = c.get("envVars");
	const isCloudflare = envVars?.CLOUDFLARE === "true";
	const environment = isCloudflare ? "Cloudflare" : "Node.js";

	return c.json({
		message: `CWHDT API Server on ${environment}`,
		version: "1.0.0",
		environment,
	});
};
