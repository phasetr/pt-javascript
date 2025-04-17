/**
 * ロガーユーティリティ
 *
 * 環境に応じてログの出力先を切り替える汎用ロガー関数を提供します。
 * ローカル環境では audio-saver-api を使用してファイルにログを保存し、
 * 本番環境では console にログを出力します。
 */

/**
 * ログレベルの型定義
 */
export type LogLevel = "log" | "warn" | "error";

/**
 * ログ保存結果の型定義
 */
export type LogResult = {
	success: boolean;
	error?: string | Error;
	[key: string]: unknown;
};

/**
 * 汎用ロガー関数
 *
 * @param message ログメッセージ
 * @param isLocal ローカル環境かどうか (true: ローカル環境, false: 本番環境)
 * @param level ログレベル ('log' | 'warn' | 'error')
 * @param sessionId セッションID (オプション、ログファイル名に使用)
 * @returns Promise<LogResult> ログ保存の結果
 */
export async function logMessage(
	message: string,
	isLocal: boolean,
	level: LogLevel = "log",
	sessionId = "app",
): Promise<LogResult> {
	// ログメッセージにレベルを付加
	const formattedMessage = `[${level.toUpperCase()}] ${message}`;

	try {
		if (isLocal) {
			// ローカル環境: audio-saver-api を使用してファイルに保存
			const response = await fetch(
				`http://localhost:3001/save-log?sessionId=${sessionId}`,
				{
					method: "POST",
					body: formattedMessage,
					headers: {
						"Content-Type": "text/plain",
					},
				},
			);
			// レスポンスを解析して結果を返す
			return (await response.json()) as LogResult;
		}

		// 本番環境: console にのみ出力
		console[level](formattedMessage);
		return { success: true } as LogResult;
	} catch (error) {
		// エラーハンドリング - 結果オブジェクトのみを返す
		return { success: false, error } as LogResult;
	}
}
