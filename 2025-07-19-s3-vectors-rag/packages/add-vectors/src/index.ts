/**
 * @fileoverview S3Vectors向けのベクトル埋め込み生成・保存ユーティリティ
 *
 * このモジュールは、テキストドキュメントの処理、AWS Bedrockを使用したベクトル埋め込みの生成、
 * および類似検索のためのS3Vectorsへの保存機能を提供します。テキストの分割、埋め込み生成、
 * メタデータ付きベクトルドキュメントの作成を処理します。
 */

import { promises as fs } from 'node:fs';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { PutVectorsCommand, S3VectorsClient } from '@aws-sdk/client-s3vectors';
import { BedrockEmbeddings } from '@langchain/aws';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';

/**
 * ベクター追加処理用のオプション設定
 *
 * @interface AddVectorsOptions
 * @property {string} title - 処理するソーステキストのタイトル
 * @property {string} bucketName - S3Vectorsバケット名
 * @property {string} indexName - S3Vectorsインデックス名
 * @property {string} sourceDir - ソースファイルディレクトリパス
 */
export type AddVectorsOptions = {
  readonly title: string;
  readonly bucketName: string;
  readonly indexName: string;
  readonly sourceDir: string;
};

/**
 * S3Vectors保存用のベクトルドキュメント構造を表現
 *
 * @interface VectorDocument
 * @property {string} key - ベクトルドキュメントの一意識別子（UUID）
 * @property {Object} data - ベクトルデータのコンテナ
 * @property {number[]} data.float32 - float32値の配列としてのベクトル埋め込み
 * @property {Object} metadata - ベクトルに関連するメタデータ
 * @property {string} metadata.text - 元のテキストチャンク（500バイトに切り詰め）
 * @property {string} metadata.title - ドキュメントのタイトル/ソース
 */
interface VectorDocument {
  key: string;
  data: {
    float32: number[];
  };
  metadata: {
    text: string;
    title: string;
  };
}

/**
 * 指定されたディレクトリからソースファイルの内容を読み込み
 *
 * 提供されたタイトルとディレクトリパスを使用してファイルからテキスト内容を読み込みます。
 * ファイルはUTF-8エンコーディングであることが期待されます。
 *
 * @param {string} title - 読み込むタイトル/ファイル名（拡張子なし）
 * @param {string} sourceDir - ソースファイルディレクトリパス（デフォルト: '../../assets'）
 * @returns {Promise<string>} ファイル内容を文字列として解決するPromise
 * @throws {Error} ファイルが存在しない、または読み込めない場合
 *
 * @example
 * ```typescript
 * const content = await readSourceFile('東京', './assets');
 * console.log('ファイル内容の長さ:', content.length);
 * ```
 */
export async function readSourceFile(
  title: string,
  sourceDir: string = '../../assets'
): Promise<string> {
  const filePath = `${sourceDir}/${title}.txt`;
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * 埋め込み処理用にMarkdownTextSplitterを使用してテキストをチャンクに分割
 *
 * 大きなテキスト内容を、ベクトル埋め込み生成に適した小さな重複するチャンクに分割します。
 * 文脈の連続性を維持するため、1024文字のチャンクサイズと256文字の重複を使用します。
 *
 * @param {string} text - チャンクに分割する入力テキスト
 * @returns {Promise<string[]>} テキストチャンクの配列（最大35個）を解決するPromise
 *
 * @example
 * ```typescript
 * const chunks = await splitTextIntoChunks('長い記事の内容...');
 * console.log('チャンク数:', chunks.length);
 * ```
 */
export async function splitTextIntoChunks(text: string): Promise<string[]> {
  const splitter = new MarkdownTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 256,
  });

  const chunks = await splitter.splitText(text);
  // 元のPythonコードと同様に35チャンクに制限
  return chunks.slice(0, 35);
}

/**
 * AWS Bedrockを使用してテキストチャンク用のベクトル埋め込みを作成
 *
 * 各テキストチャンクをAmazon Titan Embed Text v2モデルで処理し、
 * 高次元ベクトル埋め込みを生成します。各チャンクは一貫した埋め込みを生成するため順次処理されます。
 *
 * @param {string[]} chunks - 埋め込みを生成するテキストチャンクの配列
 * @returns {Promise<number[][]>} 埋め込みベクトルの配列を解決するPromise
 * @throws {Error} Bedrock API呼び出しが失敗した場合、または認証問題が発生した場合
 *
 * @example
 * ```typescript
 * const chunks = ['最初のチャンク', '2番目のチャンク'];
 * const embeddings = await createEmbeddings(chunks);
 * console.log('生成された埋め込み数:', embeddings.length);
 * ```
 */
export async function createEmbeddings(chunks: string[]): Promise<number[][]> {
  const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
  const embeddingModel = new BedrockEmbeddings({
    client: bedrockClient,
    model: 'amazon.titan-embed-text-v2:0',
  });

  const embeddings: number[][] = [];

  console.log('● ソーステキストからベクターを作成中...');

  for (const chunk of chunks) {
    const embedding = await embeddingModel.embedQuery(chunk);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * S3Vectors保存用のメタデータ付きベクトルドキュメントを作成
 *
 * テキストチャンクと対応する埋め込みを組み合わせて完全なベクトルドキュメントを作成します。
 * 各ドキュメントには一意のキー、埋め込みデータ、および元のテキスト（500バイトに切り詰め）
 * とタイトルを含むメタデータが含まれます。
 *
 * @param {string[]} chunks - 元のテキストチャンクの配列
 * @param {number[][]} embeddings - 対応するベクトル埋め込みの配列
 * @param {string} title - メタデータ用のソースタイトル
 * @returns {Promise<VectorDocument[]>} 完全なベクトルドキュメントの配列を解決するPromise
 *
 * @example
 * ```typescript
 * const chunks = ['チャンク1', 'チャンク2'];
 * const embeddings = [[1,2,3], [4,5,6]];
 * const documents = await createVectorDocuments(chunks, embeddings, '東京');
 * console.log('作成されたドキュメント数:', documents.length);
 * ```
 */
export async function createVectorDocuments(
  chunks: string[],
  embeddings: number[][],
  title: string
): Promise<VectorDocument[]> {
  const vectors: VectorDocument[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    // S3Vectorsメタデータ制限に準拠するため、テキストを500バイトに切り詰め
    const truncatedText = Buffer.from(chunk, 'utf-8')
      .subarray(0, 500)
      .toString('utf-8')
      .replace(/\uFFFD/g, ''); // 置換文字を削除

    vectors.push({
      key: uuidv4(),
      data: {
        float32: embedding,
      },
      metadata: {
        text: truncatedText,
        title,
      },
    });
  }

  return vectors;
}

/**
 * 類似検索用にS3Vectorsにベクトルドキュメントを保存
 *
 * 準備されたベクトルドキュメントを指定されたS3Vectorsバケットとインデックスにアップロードします。
 * これにより、設定された距離メトリックを使用して保存されたベクターの類似検索操作が可能になります。
 *
 * @param {VectorDocument[]} vectors - 保存するベクトルドキュメントの配列
 * @param {string} bucketName - 保存用のS3Vectorsバケット名
 * @param {string} indexName - バケット内の特定のインデックス
 * @returns {Promise<void>} ベクターが正常に保存されたときに解決されるPromise
 * @throws {Error} S3Vectors API呼び出しが失敗した場合、またはバケット/インデックスが存在しない場合
 *
 * @example
 * ```typescript
 * const vectors = [{key: 'uuid', data: {float32: [1,2,3]}, metadata: {text: 'テキスト', title: 'タイトル'}}];
 * await storeVectors(vectors, 'my-vectors-bucket', 'my-index');
 * console.log('ベクターが正常に保存されました');
 * ```
 */
export async function storeVectors(
  vectors: VectorDocument[],
  bucketName: string,
  indexName: string
): Promise<void> {
  const s3vectorsClient = new S3VectorsClient({ region: 'us-east-1' });

  const command = new PutVectorsCommand({
    vectorBucketName: bucketName,
    indexName,
    vectors,
  });

  await s3vectorsClient.send(command);
}

/**
 * コマンドライン引数を解析してAddVectorsOptionsを生成
 *
 * commander.jsを使用してコマンドライン引数を解析し、必要な設定オブジェクトを生成します。
 * デフォルト値が提供され、必須パラメータの検証も行います。
 *
 * @param {string[]} argv - コマンドライン引数配列（通常はprocess.argv）
 * @returns {AddVectorsOptions} 解析された設定オブジェクト
 * @throws {Error} 必須引数が不足している場合、または無効な値の場合
 *
 * @example
 * ```typescript
 * const options = parseCommandLineOptions([
 *   'node', 'index.js',
 *   '--title', 'メイドインアビス',
 *   '--bucket-name', 'my-bucket',
 *   '--index-name', 'my-index',
 *   '--source-dir', './assets'
 * ]);
 * ```
 */
export function parseCommandLineOptions(argv: string[]): AddVectorsOptions {
  const program = new Command();

  program
    .name('add-vectors')
    .description('Process text and add vector embeddings to S3Vectors')
    .version('1.0.0')
    .option('--title <title>', 'Source text title', 'メイドインアビス')
    .option('--bucket-name <name>', 'S3Vectors bucket name (required)')
    .option('--index-name <name>', 'S3Vectors index name', 'madeinabyss-s3vectors-search-index')
    .option('--source-dir <dir>', 'Source files directory path', '../../assets')
    .exitOverride(); // テスト中のprocess.exitを防ぐ

  try {
    program.parse(argv);
  } catch (error) {
    // Commanderのエラーをキャッチしてカスタムエラーをスロー
    if (error instanceof Error && error.message.includes('required option')) {
      if (error.message.includes('bucket-name')) {
        throw new Error('Required argument --bucket-name is missing');
      }
    }
    throw error;
  }

  const options = program.opts();

  if (!options.bucketName) {
    throw new Error('Required argument --bucket-name is missing');
  }

  return {
    title: options.title,
    bucketName: options.bucketName,
    indexName: options.indexName,
    sourceDir: options.sourceDir,
  };
}

/**
 * オプション設定の検証
 *
 * 提供されたAddVectorsOptionsの妥当性を検証します。
 * 空の値や無効な設定をチェックし、適切なエラーメッセージを提供します。
 *
 * @param {AddVectorsOptions} options - 検証するオプション設定
 * @throws {Error} オプションが無効な場合
 *
 * @example
 * ```typescript
 * const options = {
 *   title: 'メイドインアビス',
 *   bucketName: 'my-bucket',
 *   indexName: 'my-index',
 *   sourceDir: './assets'
 * };
 * validateOptions(options); // エラーなしで完了
 * ```
 */
export function validateOptions(options: AddVectorsOptions): void {
  if (!options.title || options.title.trim() === '') {
    throw new Error('Title cannot be empty');
  }

  if (!options.bucketName || options.bucketName.trim() === '') {
    throw new Error('Bucket name cannot be empty');
  }

  if (!options.indexName || options.indexName.trim() === '') {
    throw new Error('Index name cannot be empty');
  }

  if (!options.sourceDir || options.sourceDir.trim() === '') {
    throw new Error('Source directory cannot be empty');
  }
}

/**
 * 提供されたオプションでベクター追加処理を実行するメイン関数
 *
 * 環境変数ではなく引数で渡されたオプションを使用してベクター処理を実行します。
 * オプションの検証、ファイル読み込み、テキスト処理、埋め込み生成、保存の完全なワークフローを実行します。
 *
 * @param {AddVectorsOptions} options - ベクター処理用の設定オプション
 * @returns {Promise<void>} 完全なプロセスが終了したときに解決されるPromise
 * @throws {Error} プロセスの任意のステップが失敗した場合
 *
 * @example
 * ```typescript
 * const options = {
 *   title: 'メイドインアビス',
 *   bucketName: 'my-bucket',
 *   indexName: 'my-index',
 *   sourceDir: './assets'
 * };
 * await addVectors(options);
 * ```
 */
export async function addVectors(options: AddVectorsOptions): Promise<void> {
  validateOptions(options);

  console.log('🚀 ベクター追加処理を開始...');
  console.log(`タイトル: ${options.title}`);
  console.log(`バケット: ${options.bucketName}`);
  console.log(`インデックス: ${options.indexName}`);
  console.log(`ソースディレクトリ: ${options.sourceDir}`);

  try {
    // ソースファイルを読み込み
    const sourceText = await readSourceFile(options.title, options.sourceDir);

    // チャンクに分割
    const chunks = await splitTextIntoChunks(sourceText);

    // 埋め込みを作成
    const embeddings = await createEmbeddings(chunks);

    // ベクトルドキュメントを作成
    const vectors = await createVectorDocuments(chunks, embeddings, options.title);

    // ベクターを保存
    await storeVectors(vectors, options.bucketName, options.indexName);

    console.log(`● ${vectors.length}個のベクターを正常に保存しました`);
  } catch (error) {
    console.error('❌ ベクター作成エラー:', error);
    throw error;
  }
}

// 直接実行時に実行
if (require.main === module) {
  try {
    // コマンドライン引数をパース
    const options = parseCommandLineOptions(process.argv);

    // 引数ベースでベクター追加を実行
    addVectors(options).catch((error) => {
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
