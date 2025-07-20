/**
 * @fileoverview S3Vectors RAG Lambda関数
 *
 * このモジュールは、S3Vectorsとベクター検索を使用したRAG（Retrieval-Augmented Generation）
 * システムのLambda関数を実装します。質問を受け取り、関連するドキュメントを検索し、
 * Claude 3.5 Sonnetを使用して回答を生成します。
 */

import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { QueryVectorsCommand, S3VectorsClient } from '@aws-sdk/client-s3vectors';
import { BedrockEmbeddings, ChatBedrockConverse } from '@langchain/aws';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { create } from 'xmlbuilder2';

const VECTOR_BUCKET_NAME = process.env.VECTOR_BUCKET_NAME;
const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME;

/**
 * Lambda関数用のオプション設定
 *
 * @interface LambdaOptions
 * @property {string} bucketName - S3Vectorsバケット名
 * @property {string} indexName - S3Vectorsインデックス名
 */
export type LambdaOptions = {
  readonly bucketName: string;
  readonly indexName: string;
};

/**
 * APIリクエストボディの型定義
 *
 * @interface RequestBody
 * @property {string} question - RAGシステムに送信する質問
 */
interface RequestBody {
  question: string;
}

/**
 * S3Vectors RAGシステムのLambda関数ハンドラー
 *
 * 質問回答のための完全なRAGワークフローを実行します：
 * 1. リクエストボディから質問を抽出
 * 2. Amazon Titan Embed Text v2を使用して質問をベクター化
 * 3. S3Vectorsで類似ドキュメントを検索
 * 4. 検索結果をXML形式に構造化
 * 5. Claude 3.5 Sonnetを使用してコンテキスト付き回答を生成
 * 6. JSON形式で回答を返却
 *
 * 環境変数VECTOR_BUCKET_NAMEとVECTOR_INDEX_NAMEが必要です。
 *
 * @param {APIGatewayProxyEvent} event - API Gatewayからのイベントオブジェクト
 * @returns {Promise<APIGatewayProxyResult>} Lambda関数の実行結果
 *
 * @example
 * ```typescript
 * // リクエストボディの例:
 * {
 *   "question": "メイドインアビスの主人公は誰ですか？"
 * }
 *
 * // レスポンスの例:
 * {
 *   "statusCode": 200,
 *   "body": "{\"answer\": \"主人公はリコです。\"}"
 * }
 * ```
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const bucketName = VECTOR_BUCKET_NAME;
    const indexName = VECTOR_INDEX_NAME;

    if (!bucketName || !indexName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Environment variables not configured' }),
      };
    }

    const options = { bucketName, indexName };
    return await processRagRequest(event, options);
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * リクエストボディから質問を抽出する純粋関数
 *
 * @param {string | null} body - APIリクエストボディ
 * @returns {string | null} 抽出された質問、またはnull
 */
export function extractQuestion(body: string | null): string | null {
  if (!body) return null;

  try {
    const request: RequestBody = JSON.parse(body);
    const question = request.question;

    if (!question || question.trim() === '') {
      return null;
    }

    return question.trim();
  } catch {
    return null;
  }
}

/**
 * 検索結果をXMLに変換する純粋関数
 *
 * @param {Array<{text: string}>} documents - ドキュメント配列
 * @returns {string} XML形式の文字列
 */
export function convertDocumentsToXml(documents: Array<{ text: string }>): string {
  const xmlDoc = create({ version: '1.0' }).ele('documents');

  for (const doc of documents) {
    xmlDoc.ele('document').txt(doc.text);
  }

  return xmlDoc.end({ prettyPrint: true });
}

/**
 * ベクター検索結果をドキュメント配列に変換する純粋関数
 *
 * @param {any} response - S3Vectors検索レスポンス
 * @returns {Array<{text: string}>} ドキュメント配列
 */
export function extractDocumentsFromResponse(response: any): Array<{ text: string }> {
  if (!response || !response.vectors) {
    return [];
  }

  return response.vectors.map((vector: any) => {
    const text = (vector.metadata as Record<string, unknown>)?.text;
    return {
      text: typeof text === 'string' ? text : '',
    };
  });
}

/**
 * RAGリクエスト処理の純粋関数
 *
 * 環境変数に依存しない純粋なRAGワークフロー処理を実行します。
 * 1. リクエストボディから質問を抽出
 * 2. Amazon Titan Embed Text v2を使用して質問をベクター化
 * 3. S3Vectorsで類似ドキュメントを検索
 * 4. 検索結果をXML形式に構造化
 * 5. Claude 3.5 Sonnetを使用してコンテキスト付き回答を生成
 *
 * @param {APIGatewayProxyEvent} event - API Gatewayからのイベントオブジェクト
 * @param {LambdaOptions} options - S3Vectors設定オプション
 * @returns {Promise<APIGatewayProxyResult>} Lambda関数の実行結果
 *
 * @example
 * ```typescript
 * const options = {
 *   bucketName: 'my-vectors-bucket',
 *   indexName: 'my-index'
 * };
 * const result = await processRagRequest(event, options);
 * ```
 */
export async function processRagRequest(
  event: APIGatewayProxyEvent,
  options: LambdaOptions
): Promise<APIGatewayProxyResult> {
  try {
    const question = extractQuestion(event.body);

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' }),
      };
    }

    // Bedrockクライアントを初期化
    const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

    // 質問の埋め込みを作成
    const embeddingModel = new BedrockEmbeddings({
      client: bedrockClient,
      model: 'amazon.titan-embed-text-v2:0',
    });

    const embedding = await embeddingModel.embedQuery(question);

    // S3Vectorsをクエリ
    const s3vectorsClient = new S3VectorsClient({ region: 'us-east-1' });
    const queryCommand = new QueryVectorsCommand({
      vectorBucketName: options.bucketName,
      indexName: options.indexName,
      queryVector: {
        float32: embedding,
      },
      topK: 3,
      returnMetadata: true,
      returnDistance: true,
    });

    const response = await s3vectorsClient.send(queryCommand);

    // 検索結果からXMLドキュメントを作成
    const documents = extractDocumentsFromResponse(response);
    const xmlResult = convertDocumentsToXml(documents);

    // Claudeを使用して回答を生成
    const messages = [
      new SystemMessage(
        'あなたはメイドインアビスと呼ばれる作品に関する質問に回答するチャットボットです。\\n' +
          '参考となるドキュメントに記載されている内容に基づいて回答を生成してください'
      ),
      new HumanMessage(`# 参考ドキュメント\\n${xmlResult}\\n# 質問\\n${question}`),
    ];

    const model = new ChatBedrockConverse({
      client: bedrockClient,
      model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    });

    const aiResponse = await model.invoke(messages);
    const answer = aiResponse.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ answer }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
