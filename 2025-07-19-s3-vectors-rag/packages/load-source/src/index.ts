/**
 * @fileoverview Wikipedia記事取得・処理ユーティリティ
 *
 * このモジュールは、Wikipedia記事の取得、マークダウン形式への変換、
 * および後続処理のためのテキストファイルとしての保存機能を提供します。ディレクトリ作成、
 * コンテンツ抽出、および適切なエラーハンドリング付きのファイル操作を処理します。
 */

import { promises as fs } from 'node:fs';
import * as cheerio from 'cheerio';
import { Command } from 'commander';

/**
 * Wikipedia記事取得・処理用のオプション設定
 *
 * @interface LoadSourceOptions
 * @property {string} title - 取得するWikipedia記事のタイトル
 * @property {string} outputDir - 出力ディレクトリパス
 * @property {string} outputFilename - 出力ファイル名
 */
export type LoadSourceOptions = {
  readonly title: string;
  readonly outputDir: string;
  readonly outputFilename: string;
};

/**
 * ディレクトリが存在しない場合は作成
 *
 * すべての親ディレクトリが必要に応じて作成されることを保証し、ディレクトリ構造を
 * 再帰的に作成します。ディレクトリがすでに存在する場合のエラーを避けるため、
 * recursiveオプションを使用します。
 *
 * @param {string} path - 作成するディレクトリパス
 * @returns {Promise<void>} ディレクトリが作成されたときに解決されるPromise
 * @throws {Error} ファイルシステムエラーまたは権限によりディレクトリ作成が失敗した場合
 *
 * @example
 * ```typescript
 * await createDirectory('./assets/data');
 * console.log('ディレクトリが正常に作成されました');
 * ```
 */
export async function createDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

/**
 * 日本語Wikipediaから指定されたタイトルのWikipediaコンテンツを取得
 *
 * 日本語Wikipedia（ja.wikipedia.org）にHTTPリクエストを行い、記事の
 * 完全なHTMLコンテンツを取得します。この関数は、ネットワークエラーと
 * HTTPステータスコードを適切に処理します。
 *
 * @param {string} title - Wikipedia記事のタイトル（URLエンコード済み）
 * @returns {Promise<string>} WikipediaページのHTML内容を解決するPromise
 * @throws {Error} HTTPリクエストが失敗した場合、または200以外のステータスコードが返された場合
 *
 * @example
 * ```typescript
 * const html = await fetchWikipediaContent('東京');
 * console.log('取得した記事の長さ:', html.length);
 * ```
 */
export async function fetchWikipediaContent(title: string): Promise<string> {
  const url = `https://ja.wikipedia.org/wiki/${title}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Wikipedia content: ${response.status}`);
  }

  return await response.text();
}

/**
 * メインのWikipediaコンテンツを抽出してHTMLをマークダウンテキストに変換
 *
 * WikipediaのHTMLを解析し、'.mw-body-content'セクションからメイン記事コンテンツのみを
 * 抽出し、すべてのHTMLタグを削除してクリーンなテキストを返します。
 * これにより、ナビゲーション、サイドバー、その他の非コンテンツ要素がフィルタリングされます。
 *
 * @param {string} html - Wikipediaからの生のHTMLコンテンツ
 * @returns {Promise<string>} クリーンなマークダウンテキストコンテンツを解決するPromise
 *
 * @example
 * ```typescript
 * const html = '<div class="mw-body-content"><p>記事の内容</p></div>';
 * const text = await convertHtmlToMarkdown(html);
 * console.log(text); // "記事の内容"
 * ```
 */
export async function convertHtmlToMarkdown(html: string): Promise<string> {
  const $ = cheerio.load(html);
  const content = $('.mw-body-content');

  if (content.length === 0) {
    return '';
  }

  // HTMLタグなしでテキストコンテンツを抽出
  return content.text().trim();
}

/**
 * UTF-8エンコーディングでファイルにコンテンツを保存
 *
 * 提供されたコンテンツをUTF-8エンコーディングを使用して指定されたファイルパスに書き込みます。
 * ファイルがすでに存在する場合は上書きされます。この関数を呼び出す前に
 * ディレクトリパスが存在する必要があります。
 *
 * @param {string} filePath - ファイルを保存する完全なパス
 * @param {string} content - ファイルに書き込むテキストコンテンツ
 * @returns {Promise<void>} ファイルが正常に書き込まれたときに解決されるPromise
 * @throws {Error} ファイルシステムエラーまたは権限によりファイル書き込みが失敗した場合
 *
 * @example
 * ```typescript
 * await saveToFile('./assets/article.txt', 'ここに記事の内容');
 * console.log('ファイルが正常に保存されました');
 * ```
 */
export async function saveToFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * コマンドライン引数を解析してLoadSourceOptionsを生成
 *
 * commander.jsを使用してコマンドライン引数を解析し、必要な設定オブジェクトを生成します。
 * デフォルト値が提供され、必須パラメータの検証も行います。
 *
 * @param {string[]} argv - コマンドライン引数配列（通常はprocess.argv）
 * @returns {LoadSourceOptions} 解析された設定オブジェクト
 * @throws {Error} 必須引数が不足している場合、または無効な値の場合
 *
 * @example
 * ```typescript
 * const options = parseCommandLineOptions([
 *   'node', 'index.js',
 *   '--title', 'メイドインアビス',
 *   '--output-dir', './assets',
 *   '--output-filename', 'article.txt'
 * ]);
 * ```
 */
export function parseCommandLineOptions(argv: string[]): LoadSourceOptions {
  const program = new Command();

  program
    .name('load-source')
    .description('Load Wikipedia article and save as text file')
    .version('1.0.0')
    .option('--title <title>', 'Wikipedia article title', 'メイドインアビス')
    .option('--output-dir <dir>', 'Output directory path', '../../assets')
    .option('--output-filename <filename>', 'Output filename')
    .exitOverride(); // テスト中のprocess.exitを防ぐ

  program.parse(argv);
  const options = program.opts();

  // output-filenameが指定されていない場合はタイトル.txtを使用
  const outputFilename = options.outputFilename || `${options.title}.txt`;

  return {
    title: options.title,
    outputDir: options.outputDir,
    outputFilename,
  };
}

/**
 * オプション設定の検証
 *
 * 提供されたLoadSourceOptionsの妥当性を検証します。
 * 空の値や無効な設定をチェックし、適切なエラーメッセージを提供します。
 *
 * @param {LoadSourceOptions} options - 検証するオプション設定
 * @throws {Error} オプションが無効な場合
 *
 * @example
 * ```typescript
 * const options = {
 *   title: 'メイドインアビス',
 *   outputDir: './assets',
 *   outputFilename: 'article.txt'
 * };
 * validateOptions(options); // エラーなしで完了
 * ```
 */
export function validateOptions(options: LoadSourceOptions): void {
  if (!options.title || options.title.trim() === '') {
    throw new Error('Title cannot be empty');
  }

  if (!options.outputDir || options.outputDir.trim() === '') {
    throw new Error('Output directory cannot be empty');
  }

  if (!options.outputFilename || options.outputFilename.trim() === '') {
    throw new Error('Output filename cannot be empty');
  }
}

/**
 * 提供されたオプションでWikipediaソースをロードしてファイルに保存するメイン関数
 *
 * 環境変数ではなく引数で渡されたオプションを使用してWikipediaコンテンツ処理を実行します。
 * オプションの検証、ディレクトリ作成、記事取得、変換、保存の完全なワークフローを実行します。
 *
 * @param {LoadSourceOptions} options - 記事取得・保存用の設定オプション
 * @returns {Promise<void>} 完全なプロセスが終了したときに解決されるPromise
 * @throws {Error} プロセスの任意のステップが失敗した場合
 *
 * @example
 * ```typescript
 * const options = {
 *   title: 'メイドインアビス',
 *   outputDir: './assets',
 *   outputFilename: 'article.txt'
 * };
 * await loadSource(options);
 * ```
 */
export async function loadSource(options: LoadSourceOptions): Promise<void> {
  validateOptions(options);

  console.log('🚀 Wikipedia記事の取得を開始...');
  console.log(`記事タイトル: ${options.title}`);
  console.log(`出力ディレクトリ: ${options.outputDir}`);
  console.log(`出力ファイル名: ${options.outputFilename}`);

  try {
    // 出力ディレクトリを作成
    await createDirectory(options.outputDir);

    // Wikipediaコンテンツを取得
    const html = await fetchWikipediaContent(options.title);

    // マークダウンに変換
    const markdown = await convertHtmlToMarkdown(html);

    // ファイルに保存
    const filePath = `${options.outputDir}/${options.outputFilename}`;
    await saveToFile(filePath, markdown);

    console.log(`✅ Wikipediaコンテンツを${filePath}に正常に保存しました`);
  } catch (error) {
    console.error('❌ Wikipedia記事取得中にエラーが発生:', error);
    throw error;
  }
}

// 直接実行時に実行
if (require.main === module) {
  try {
    // コマンドライン引数をパース
    const options = parseCommandLineOptions(process.argv);

    // 引数ベースで記事取得を実行
    loadSource(options).catch((error) => {
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
