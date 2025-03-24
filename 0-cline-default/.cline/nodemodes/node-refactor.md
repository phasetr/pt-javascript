---
name: Node:RefactorModule
groups:
  - read
  - edit
  - browser
  - command
  - mcp
source: "project"
---

次の2つのコマンドがあることを前提とする。

- `npx typedoc --json docs.json index.ts && npx typedoc-json-parser docs.json`: 仕様を確認（TypeScript の場合）。
- `npm run health`: モジュールの健全度を確認（package.json に定義されているとする）

これを前提にリファクタを行う。以下のステップにしたがう。

- 仕様確認フェーズ: 最初に必ず `npx typedoc --json docs.json index.ts && npx typedoc-json-parser docs.json` を実行する（TypeScript の場合）。
- 提案フェーズ: ユーザーにどのような変更を行うかステップバイステップで提案し、合意を取る
- 実装フェーズ: ユーザーに提案した修正をステップごとに実行する。
- 改善フェーズ

## 禁止事項

- 仕様確認フェーズにおいて API ドキュメントを見る前に、内部実装のコードを確認することは許可されていない。
- 提案実装フェーズにおいて、 `index.ts` の公開インターフェースを、ユーザーの許可無く追加/修正することは許可されていない。

## 仕様確認フェーズ

必ず次のコマンドを実行する。

- `$ npx typedoc --json docs.json index.ts && npx typedoc-json-parser docs.json` で対象モジュールの仕様を確認する（TypeScript の場合）
- `$ npm run health` でリポジトリの状態を確認（package.json に定義されているとする）
  - 型チェック
  - lint
  - テストカバレッジ

この結果から、ユーザーに修正を提案する。

## 提案フェーズ

- どのような修正したいのか、TypeScript の型シグネチャと提案とテストコードで説明する。修正でない限り、インターフェースの確認で、実装する必要はない。
- 内部のリファクタリングか、公開APIの修正なのかを区別する
  - 公開インターフェースの場合、index.ts に追加する
- 実装手順をステップバイステップで説明する

インターフェースの提案の例

```ts
/**
 * Calculates the Manhattan distance between two points in a 2D space
 * @param p1 First point
 * @param p2 Second point
 * @returns The sum of absolute differences of their coordinates
 */
export function manhattanDistance(p1: Point, p2: Point): number {
  // ...
}
```

テストの提案

```ts
// test/distance.test.ts に追加
import { manhattanDistance } from "../index";
import { test, expect } from "vitest";

test("manhattanDistance calculates correct Manhattan distance", () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 3, y: 4 };
  expect(manhattanDistance(p1, p2)).toBe(7); // |3-0| + |4-0| = 7
});
```

## 実装フェーズ

最初に、型の整合性を確認する。提案したコードを反映して、型の check が通るかを修正する。

新規実装の場合、最初に実装せずに、例外で型チェックのみを通す。

例

```ts
export function manhattanDistance(p1: Point, p2: Point): number {
  throw new Error("Not implemented");
}
```

`$ npx tsc --noEmit` で型を確認する。

そのうえで、型チェックが合意が取れた提案を、ステップごとに実行する。それぞれのステップごとに必ず `npx vitest` で変更対象のユニットテストを実行する。

## 改善フェーズ

`$ npm run health` により、テストを満たす範囲でコードを改善をしていく。

目指す状態

- 説明的なコード
  - TypeDoc でプロジェクトの状態を読み取れるように
- モジュール境界は小さく
  - `index.ts` の export は最小限にする
  - `examples/*.ts` は index.ts に対して説明的な
- デッドコードは少なく
  - ESLint の no-unused-vars ルールなどを使ってデッドコードを確認する
  - `npx eslint --rule 'no-unused-vars: error' .`
  - 代替がない場合は `deno run -A npm:tsr` を使用
- カバレッジをより高く
  - テストが通っている限りで、内部のコードは削除する。
  - `npx vitest --coverage` でカバレッジを確認する
