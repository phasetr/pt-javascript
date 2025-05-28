---
name: Node:Script
groups:
  - read
  - edit
  - browser
  - command
  - mcp
source: "project"
---

# ScriptMode

- 外部依存を可能な限り減らして、一つのファイルに完結してすべてを記述する
- テストコードも同じファイルに記述する
- スクリプトモードは `@script` がコード中に含まれる場合、あるいは `scripts/*` や
  `script/*`, `poc/*` 以下のファイルが該当する

スクリプトモードの例

```ts
/* @script */
/**
 * 足し算を行うモジュール
 */
function add(a: number, b: number): number {
  return a + b;
}

// node add.ts で動作確認するエントリポイント
if (require.main === module) {
  console.log(add(1, 2));
}

/// test
import { expect, test } from "vitest";

test("add(1, 2) = 3", () => {
  expect(add(1, 2)).toBe(3);
});

// CommonJS モジュールとしてエクスポート
module.exports = { add };
```

CLINE/Rooのようなコーディングエージェントは、まず `npx ts-node add.ts`
で実行して、要求に応じて `npx vitest add.ts`
で実行可能なようにテストを増やしていく。

スクリプトモードでは曖昧なバージョンの import を許可する。

優先順

- package.json に定義された依存関係
- 直接 require/import

```ts
// OK
import lodash from 'lodash';

// 必要に応じて直接バージョン指定も可能（ただし package.json での管理が推奨）
// npm install lodash@4.17.21 --save
```

最初にスクリプトモードで検証し、モジュールモードに移行していく。

## ES Modules の場合

ES Modules を使用する場合は、ファイル拡張子を `.mts` にするか、package.json に `"type": "module"` を追加する。

```ts
/* @script */
/**
 * 足し算を行うモジュール
 */
function add(a: number, b: number): number {
  return a + b;
}

// node add.mts で動作確認するエントリポイント
if (import.meta.url === import.meta.main) {
  console.log(add(1, 2));
}

/// test
import { expect, test } from "vitest";

test("add(1, 2) = 3", () => {
  expect(add(1, 2)).toBe(3);
});

// ES Modules としてエクスポート
export { add };
```

## 適切な代替がない Deno 機能の利用

Deno の一部機能は Node.js に直接の代替がない場合があります。そのような場合は、Deno を直接利用することも可能です：

```ts
// Deno 固有の機能を使用する場合
// 事前に Deno をインストールしておく必要があります
// https://deno.land/manual/getting_started/installation

// 例: Deno の組み込み KV ストアを使用
async function useDenoDB() {
  const command = new Deno.Command("deno", {
    args: ["run", "--allow-read", "--allow-write", "deno-script.ts"],
    stdout: "piped",
  });
  const output = await command.output();
  console.log(new TextDecoder().decode(output.stdout));
}

// Node.js から Deno スクリプトを実行
if (require.main === module) {
  const { execSync } = require("child_process");
  try {
    const output = execSync("deno run --allow-read deno-script.ts");
    console.log(output.toString());
  } catch (error) {
    console.error("Deno 実行エラー:", error);
  }
}
```
