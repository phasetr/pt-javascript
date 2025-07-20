/**
 * @fileoverview S3Vectors API クエリユーティリティ
 *
 * このモジュールは、CloudFormationスタックからAPI Gateway エンドポイントを取得し、
 * RAGベースの質問回答システムにクエリを送信する機能を提供します。Railway-Oriented Programming
 * パターンを使用した型安全なエラーハンドリングを実装します。
 */

import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

/**
 * Railway-Oriented Programming用のResult型定義
 *
 * 成功と失敗の両方の状態を型安全に表現するためのResult型。エラーハンドリングを
 * 一貫性をもって行い、例外ベースではなく明示的なエラー状態を管理します。
 *
 * @template T - 成功時の値の型
 * @template E - エラー時の値の型（デフォルトはstring）
 * @property {true} success - 成功時のフラグ
 * @property {T} value - 成功時の値
 * @property {false} success - 失敗時のフラグ
 * @property {E} error - 失敗時のエラー情報
 */
export type Result<T, E = string> = { success: true; value: T } | { success: false; error: E };

/**
 * CloudFormationスタックからAPI Gateway エンドポイントを取得
 *
 * 指定されたCloudFormationスタックの出力からAPI Gateway エンドポイントURLを取得します。
 * スタックの存在確認とエンドポイント出力の検証を行い、Result型でラップした結果を返します。
 *
 * @param {string} stackName - API Gateway エンドポイントを含むCloudFormationスタック名
 * @returns {Promise<Result<string>>} エンドポイントURLまたはエラー情報を含むResult
 *
 * @example
 * ```typescript
 * const result = await getApiEndpoint('MyApiStack');
 * if (result.success) {
 *   console.log('エンドポイント:', result.value);
 * } else {
 *   console.error('エラー:', result.error);
 * }
 * ```
 */
export async function getApiEndpoint(stackName: string): Promise<Result<string>> {
  try {
    const client = new CloudFormationClient({ region: 'us-east-1' });
    const command = new DescribeStacksCommand({ StackName: stackName });

    const response = await client.send(command);

    if (!response.Stacks || response.Stacks.length === 0) {
      return { success: false, error: 'Stack not found' };
    }

    const stack = response.Stacks[0];
    const endpoint = stack.Outputs?.find(
      (output) => output.OutputKey === 'ApiGatewayEndpoint'
    )?.OutputValue;

    if (!endpoint) {
      return { success: false, error: 'API Gateway endpoint not found in stack outputs' };
    }

    return { success: true, value: endpoint };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * RAG APIに質問クエリを送信
 *
 * 指定されたAPI エンドポイントに質問をPOSTリクエストで送信し、RAGシステムからの
 * 回答を取得します。HTTPステータスコードの検証とJSONレスポンスの解析を行います。
 *
 * @param {string} endpoint - APIのエンドポイントURL
 * @param {string} question - RAGシステムに送信する質問
 * @returns {Promise<Result<unknown>>} API応答データまたはエラー情報を含むResult
 *
 * @example
 * ```typescript
 * const result = await queryApi('https://api.example.com', '東京の人口は？');
 * if (result.success) {
 *   console.log('回答:', result.value);
 * } else {
 *   console.error('エラー:', result.error);
 * }
 * ```
 */
export async function queryApi(endpoint: string, question: string): Promise<Result<unknown>> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP Error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, value: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * クエリ実行のメイン統合関数
 *
 * RAGシステムへのクエリ実行の完全なワークフローを調整します：
 * 1. CloudFormationスタックからAPI Gateway エンドポイントを取得
 * 2. 取得したエンドポイントに質問を送信
 * 3. 結果をJSON形式で出力（jq互換フォーマット）
 *
 * エラーが発生した場合は適切なエラーメッセージを表示し、プロセスを終了します。
 *
 * @param {string} question - RAGシステムに送信する質問
 * @returns {Promise<void>} 完全なクエリプロセスが終了したときに解決されるPromise
 *
 * @example
 * ```typescript
 * await main('東京タワーの高さは？');
 * // JSON形式の回答が出力される
 * ```
 */
export async function main(question: string): Promise<void> {
  const stackName = 'MadeinabyssS3VectorsRagTypeScriptStack';

  // API Gateway エンドポイント取得
  const endpointResult = await getApiEndpoint(stackName);
  if (!endpointResult.success) {
    console.error(`Error: ${endpointResult.error}`);
    process.exit(1);
  }

  // APIクエリ実行
  const queryResult = await queryApi(endpointResult.value, question);
  if (!queryResult.success) {
    console.error(`Error: ${queryResult.error}`);
    process.exit(1);
  }

  // 結果出力（jqフォーマット互換）
  console.log(JSON.stringify(queryResult.value));
}

// CLI実行時のエントリーポイント
if (require.main === module) {
  const question = process.argv[2];

  if (!question) {
    console.error('Usage: node dist/index.js <question>');
    process.exit(1);
  }

  main(question).catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
