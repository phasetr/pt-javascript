# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)

## プロジェクト概要

要記述

## プロジェクトの略称

要記述

## 基本的なインフラ

- `AWS`
- `Cloudflare`

## 作業手順

### AI用

### 自分用(都度消す)

```sh
cdk init sample-app --language typescript
npm create hono@latest apps/hono
npx create-remix@latest apps/remix
```

## `cline/roomodes`更新時の対処

`.cline/roomodes`内の`deno`の記述を適切な形で`node.js`・`npm`前提の記述に書き換え,
`cline/nodemodes`ディレクトリに書き出してください.
さらに次の各指示にもしたがってください.

1. `deno doc`など`npm`前提の状況でも使え,
   適切な代替が存在しない対象は`deno`の機構をそのまま利用する
2. テストは`vitest`を利用する
3. ビルド結果の記述のような`js`であるべき部分を除き,
   原則として`ts`を利用する
 
