# ステップ4: CDKでSNSを設定する - トラブルシューティング

## 発生した問題

CDKスタックのデプロイ時に以下のエラーが発生しました。

```txt
TSError: ⨯ Unable to compile TypeScript:
bin/ccqm.ts:3:27 - error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.

3 import { CcqmStack } from "../lib/ccqm-stack.ts";
                            ~~~~~~~~~~~~~~~~~~~~~~
bin/ccqm.ts:4:8 - error TS1259: Module '"node:process"' can only be default-imported using the 'esModuleInterop' flag

4 import process from "node:process";
         ~~~~~~~
```

## 原因

1. TypeScriptのインポートパスに問題があった
   - `bin/ccqm.ts`ファイルで、インポートパスに`.ts`拡張子が含まれていた
   - `process`モジュールのインポート方法が不適切だった

2. TypeScriptの設定に問題があった
   - `tsconfig.json`ファイルに`esModuleInterop`フラグが設定されていなかった

## 対応手順

### 1. TypeScriptの設定を修正

`packages/ccqm/tsconfig.json`ファイルに`esModuleInterop`と`skipLibCheck`を追加しました。

```json
{
  "compilerOptions": {
    // 既存の設定...
    "esModuleInterop": true,
    "skipLibCheck": true,
    // 他の設定...
  }
}
```

### 2. インポートパスの修正

`packages/ccqm/bin/ccqm.ts`ファイルのインポートパスを修正しました。

```typescript
// 修正前
import { CcqmStack } from "../lib/ccqm-stack.ts";
import process from "node:process";

// 修正後
import { CcqmStack } from "../lib/ccqm-stack";
import * as process from "node:process";
```

### 3. aws-utilsパッケージのインポートパス修正

ESMモジュール形式を使用している`packages/aws-utils`パッケージのインポートパスも修正しました。

```typescript
// 修正前
import { sendEmail } from "./index";
import process from "node:process";

// 修正後
import { sendEmail } from "./index.js";
import * as process from "node:process";
```

## 修正後の結果

修正後、CDKスタックのデプロイが成功し、以下の出力が得られました。

```txt
Outputs:
CCQM-Stack-dev.EmailTopicArn = arn:aws:sns:ap-northeast-1:573143736992:CCQM-EmailTopic-dev
CCQM-Stack-dev.QueueUrl = https://sqs.ap-northeast-1.amazonaws.com/573143736992:CCQM-QueueingQueue-dev
CCQM-Stack-dev.QueueingTopicArn = arn:aws:sns:ap-northeast-1:573143736992:CCQM-QueueingTopic-dev
```

## 学んだこと

1. **TypeScriptのモジュール形式の違いに注意**
   - CommonJS形式（`module: "commonjs"`）とESM形式（`module: "NodeNext"`）ではインポートパスの扱いが異なる
   - ESM形式では相対インポートに拡張子（`.js`）を含める必要がある

2. **Node.jsモジュールのインポート方法**
   - `esModuleInterop`フラグが有効でない場合、デフォルトインポートは使用できない
   - 代わりに名前付きインポート（`import * as process from "node:process"`）を使用する

3. **CDKプロジェクトの設定**
   - CDKプロジェクトはCommonJS形式を使用するのが一般的
   - AWS SDKを使用するパッケージはESM形式を使用することもある
   - 異なるモジュール形式を使用する場合は、それぞれの規則に従う必要がある

## 今後の注意点

1. **モジュール形式の統一**
   - プロジェクト内でモジュール形式を統一するか、明確に区別する
   - 混在する場合は、それぞれの規則を理解して適切に設定する

2. **TypeScriptの設定確認**
   - 新しいパッケージを追加する際は、`tsconfig.json`の設定を確認する
   - 特に`module`、`moduleResolution`、`esModuleInterop`の設定に注意する

3. **インポートパスの確認**
   - ESM形式を使用する場合は、相対インポートに拡張子を含める
   - CommonJS形式を使用する場合は、拡張子を省略する
