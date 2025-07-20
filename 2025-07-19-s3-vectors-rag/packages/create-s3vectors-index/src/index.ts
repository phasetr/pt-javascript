/**
 * @fileoverview ベクター保存インフラ向けS3Vectorsインデックス作成ユーティリティ
 *
 * このモジュールは、ベクター保存と類似検索操作のためのS3Vectorsバケットとインデックスの作成機能を提供します。
 * 環境変数の検証、バケット作成、および異なる距離メトリックをサポートするインデックス設定を処理します。
 */

import {
  CreateIndexCommand,
  CreateVectorBucketCommand,
  S3VectorsClient,
} from '@aws-sdk/client-s3vectors';
import { Command } from 'commander';

/**
 * S3Vectorsインデックス作成用の設定
 *
 * @interface IndexConfig
 * @property {string} bucketName - 作成するS3Vectorsバケットの名前
 * @property {string} indexName - 作成するベクターインデックスの名前
 * @property {number} dimension - ベクターの次元数（例：埋め込み用の1024）
 * @property {'euclidean' | 'cosine'} distanceMetric - 類似度計算用の距離メトリック
 * @property {'float32'} dataType - ベクター保存用のデータ型（現在はfloat32のみサポート）
 */
export type IndexConfig = {
  readonly bucketName: string;
  readonly indexName: string;
  readonly dimension: number;
  readonly distanceMetric: 'euclidean' | 'cosine';
  readonly dataType: 'float32';
};

/**
 * ベクター保存用の新しいS3Vectorsバケットを作成
 *
 * ベクター埋め込みと関連メタデータの保存に使用される新しいS3Vectorsバケットを初期化します。
 * バケットはus-east-1リージョンに作成されます。
 *
 * @param {string} bucketName - 作成するS3Vectorsバケットの名前
 * @returns {Promise<void>} バケットが正常に作成されたときに解決されるPromise
 * @throws {Error} AWS APIエラーまたは権限問題によりバケット作成が失敗した場合
 *
 * @example
 * ```typescript
 * await createVectorBucket('my-vectors-bucket');
 * console.log('バケットが正常に作成されました');
 * ```
 */
export async function createVectorBucket(bucketName: string): Promise<void> {
  const client = new S3VectorsClient({ region: 'us-east-1' });
  const command = new CreateVectorBucketCommand({
    vectorBucketName: bucketName,
  });

  await client.send(command);
  console.log(`✅ S3Vectorsバケットを正常に作成しました: ${bucketName}`);
}

/**
 * S3Vectorsバケット内にベクターインデックスを作成
 *
 * 高次元ベクターの保存と検索のために、指定された設定でベクターインデックスを設定します。
 * インデックスは設定された距離メトリックを使用した類似検索操作をサポートします。
 *
 * @param {IndexConfig} config - インデックス作成用の完全な設定
 * @param {string} config.bucketName - S3Vectorsバケット名
 * @param {string} config.indexName - 新しいインデックスの名前
 * @param {number} config.dimension - ベクターの次元数（埋め込みサイズと一致する必要）
 * @param {'euclidean' | 'cosine'} config.distanceMetric - 距離計算方法
 * @param {'float32'} config.dataType - ベクターデータ型
 * @returns {Promise<void>} インデックスが正常に作成されたときに解決されるPromise
 * @throws {Error} 設定エラーまたはAWS API問題によりインデックス作成が失敗した場合
 *
 * @example
 * ```typescript
 * const config = {
 *   bucketName: 'my-vectors-bucket',
 *   indexName: 'embeddings-index',
 *   dimension: 1024,
 *   distanceMetric: 'cosine' as const,
 *   dataType: 'float32' as const
 * };
 * await createIndex(config);
 * ```
 */
export async function createIndex(config: IndexConfig): Promise<void> {
  const client = new S3VectorsClient({ region: 'us-east-1' });
  const command = new CreateIndexCommand({
    vectorBucketName: config.bucketName,
    indexName: config.indexName,
    dimension: config.dimension,
    distanceMetric: config.distanceMetric,
    dataType: config.dataType,
  });

  await client.send(command);
  console.log(`✅ S3Vectorsインデックスを正常に作成しました: ${config.indexName}`);
}

/**
 * コマンドライン引数を解析してIndexConfigを生成
 *
 * commander.jsを使用してコマンドライン引数を解析し、必要な設定オブジェクトを生成します。
 * デフォルト値が提供され、必須パラメータの検証も行います。
 *
 * @param {string[]} argv - コマンドライン引数配列（通常はprocess.argv）
 * @returns {IndexConfig} 解析された設定オブジェクト
 * @throws {Error} 必須引数が不足している場合、または無効な値の場合
 *
 * @example
 * ```typescript
 * const config = parseCommandLineOptions([
 *   'node', 'index.js',
 *   '--bucket-name', 'my-bucket',
 *   '--index-name', 'my-index',
 *   '--dimension', '1024',
 *   '--distance-metric', 'cosine'
 * ]);
 * ```
 */
export function parseCommandLineOptions(argv: string[]): IndexConfig {
  const program = new Command();

  program
    .name('create-s3vectors-index')
    .description('Create S3Vectors bucket and index for vector storage')
    .version('1.0.0')
    .option('--bucket-name <name>', 'S3Vectors bucket name (required)')
    .option('--index-name <name>', 'Vector index name', 'madeinabyss-s3vectors-search-index')
    .option('--dimension <number>', 'Vector dimension', '1024')
    .option('--distance-metric <metric>', 'Distance metric (euclidean or cosine)', 'euclidean')
    .exitOverride(); // テスト中のprocess.exitを防ぐ

  try {
    program.parse(argv);
  } catch (error) {
    // Commanderのエラーをキャッチしてカスタムエラーをスロー
    if (error instanceof Error && error.message.includes('required option')) {
      throw new Error('Required argument --bucket-name is missing');
    }
    throw error;
  }

  const options = program.opts();

  if (!options.bucketName) {
    throw new Error('Required argument --bucket-name is missing');
  }

  const dimension = Number.parseInt(options.dimension, 10);
  if (Number.isNaN(dimension)) {
    throw new Error('Dimension must be a valid number');
  }

  const distanceMetric = options.distanceMetric === 'cosine' ? 'cosine' : 'euclidean';

  return {
    bucketName: options.bucketName,
    indexName: options.indexName,
    dimension,
    distanceMetric: distanceMetric as IndexConfig['distanceMetric'],
    dataType: 'float32' as IndexConfig['dataType'],
  };
}

/**
 * オプション設定の検証
 *
 * 提供されたIndexConfigオプションの妥当性を検証します。
 * 空の値や無効な設定をチェックし、適切なエラーメッセージを提供します。
 *
 * @param {IndexConfig} options - 検証するオプション設定
 * @throws {Error} オプションが無効な場合
 *
 * @example
 * ```typescript
 * const options = {
 *   bucketName: 'my-bucket',
 *   indexName: 'my-index',
 *   dimension: 1024,
 *   distanceMetric: 'cosine' as const,
 *   dataType: 'float32' as const
 * };
 * validateOptions(options); // エラーなしで完了
 * ```
 */
export function validateOptions(options: IndexConfig): void {
  if (!options.bucketName || options.bucketName.trim() === '') {
    throw new Error('Bucket name cannot be empty');
  }

  if (!options.indexName || options.indexName.trim() === '') {
    throw new Error('Index name cannot be empty');
  }

  if (options.dimension <= 0) {
    throw new Error('Dimension must be a positive number');
  }

  if (!['euclidean', 'cosine'].includes(options.distanceMetric)) {
    throw new Error('Distance metric must be "euclidean" or "cosine"');
  }

  if (options.dataType !== 'float32') {
    throw new Error('Data type must be "float32"');
  }
}

/**
 * 提供されたオプションでS3Vectorsインデックスを作成するメイン関数
 *
 * 環境変数ではなく引数で渡されたオプションを使用してS3Vectorsインフラを作成します。
 * オプションの検証、S3Vectorsバケット作成、インデックス作成の完全なワークフローを実行します。
 *
 * @param {IndexConfig} options - インデックス作成用の設定オプション
 * @returns {Promise<void>} 完全な設定が終了したときに解決されるPromise
 * @throws {Error} 設定プロセスの任意のステップが失敗した場合
 *
 * @example
 * ```typescript
 * const options = {
 *   bucketName: 'my-vectors-bucket',
 *   indexName: 'my-search-index',
 *   dimension: 1024,
 *   distanceMetric: 'cosine' as const,
 *   dataType: 'float32' as const
 * };
 * await createS3VectorsIndex(options);
 * ```
 */
export async function createS3VectorsIndex(options: IndexConfig): Promise<void> {
  validateOptions(options);

  console.log('🚀 S3Vectorsインデックス作成を開始...');
  console.log(`バケット: ${options.bucketName}`);
  console.log(`インデックス: ${options.indexName}`);
  console.log(`次元数: ${options.dimension}`);
  console.log(`距離メトリック: ${options.distanceMetric}`);
  console.log(`データ型: ${options.dataType}`);

  try {
    await createVectorBucket(options.bucketName);
    await createIndex(options);
    console.log('🎉 S3Vectorsインデックス作成が正常に完了しました！');
  } catch (error) {
    console.error('❌ S3Vectorsインデックス作成中にエラーが発生:', error);
    throw error;
  }
}

// 直接実行時に実行
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // コマンドライン引数をパース
    const options = parseCommandLineOptions(process.argv);

    // 引数ベースでインデックス作成を実行
    createS3VectorsIndex(options).catch((error) => {
      console.error('❌ エラー:', error.message);
      process.exit(1);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ 引数エラー:', error.message);
    } else {
      console.error('❌ 予期しないエラー:', error);
    }
    process.exit(1);
  }
}
