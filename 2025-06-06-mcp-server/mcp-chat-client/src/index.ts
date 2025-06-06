#!/usr/bin/env node
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import ora from "ora";

interface ToolCallResult {
  content: Array<{ type: string; text: string }>;
}

// カラー付きのロゴ
const LOGO = chalk.cyan(`
╔══════════════════════════════════════╗
║    MCP Chat Client - Hello World     ║
╚══════════════════════════════════════╝
`);

// ヘルプメッセージ
const HELP_MESSAGE = `
${chalk.yellow('利用可能なコマンド:')}
  ${chalk.green('/help')}     - このヘルプメッセージを表示
  ${chalk.green('/tools')}    - 利用可能なツールの一覧を表示
  ${chalk.green('/hello')}    - Hello Worldツールを実行（名前なし）
  ${chalk.green('/hello <name>')} - Hello Worldツールを実行（名前あり）
  ${chalk.green('/exit')}     - チャットを終了
  ${chalk.green('/quit')}     - チャットを終了

${chalk.yellow('使用例:')}
  /hello
  /hello Alice
`;

async function main() {
  console.clear();
  console.log(LOGO);
  console.log(chalk.gray('MCPサーバーに接続中...\n'));

  // スピナーを表示
  const spinner = ora('サーバーを起動しています...').start();

  // MCPクライアントの作成
  const client = new Client(
    {
      name: "hello-world-chat-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  // クライアントトランスポートの作成
  const transport = new StdioClientTransport({
    command: "node",
    args: ["../mcp-server/dist/index.js"],
  });

  try {
    // サーバーに接続
    await client.connect(transport);
    spinner.succeed('MCPサーバーに接続しました！');
    
    // 利用可能なツールを取得
    const tools = await client.listTools();
    console.log(chalk.blue(`\n利用可能なツール: ${tools.tools.length}個`));
    console.log(chalk.gray('ヘルプを表示するには /help と入力してください\n'));

    // readlineインターフェースの作成
    const rl = readline.createInterface({ input, output });

    // チャットループ
    while (true) {
      const answer = await rl.question(chalk.yellow('> '));
      
      // コマンドの処理
      if (answer.toLowerCase() === '/exit' || answer.toLowerCase() === '/quit') {
        console.log(chalk.gray('\nさようなら！'));
        break;
      }

      if (answer.toLowerCase() === '/help') {
        console.log(HELP_MESSAGE);
        continue;
      }

      if (answer.toLowerCase() === '/tools') {
        console.log(chalk.blue('\n利用可能なツール:'));
        for (const tool of tools.tools) {
          console.log(chalk.green(`  - ${tool.name}`), chalk.gray(`(${tool.description})`));
        }
        console.log();
        continue;
      }

      if (answer.toLowerCase() === '/hello' || answer.toLowerCase().startsWith('/hello ')) {
        const parts = answer.split(' ');
        const name = parts.slice(1).join(' ').trim();
        
        const callSpinner = ora('ツールを実行中...').start();
        
        try {
          const result = await client.callTool({
            name: "hello",
            arguments: name ? { name } : {},
          }) as ToolCallResult;
          
          callSpinner.succeed('実行完了');
          console.log(chalk.cyan('応答:'), result.content[0].text);
          console.log();
        } catch (error) {
          callSpinner.fail('エラーが発生しました');
          console.error(chalk.red('エラー:'), error);
          console.log();
        }
        continue;
      }

      // 未知のコマンド
      if (answer.startsWith('/')) {
        console.log(chalk.red(`未知のコマンド: ${answer}`));
        console.log(chalk.gray('/help でヘルプを表示できます\n'));
        continue;
      }

      // 通常のメッセージ（今回は何もしない）
      console.log(chalk.gray('（通常のメッセージは処理されません。/help でヘルプを表示）\n'));
    }

    // クリーンアップ
    rl.close();
    await client.close();
    process.exit(0);

  } catch (error) {
    spinner.fail('接続エラー');
    console.error(chalk.red('エラー:'), error);
    process.exit(1);
  }
}

// Ctrl+C でクリーンに終了
process.on('SIGINT', () => {
  console.log(chalk.gray('\n\n終了中...'));
  process.exit(0);
});

main();