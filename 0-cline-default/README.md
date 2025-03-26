# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

要記述

## プロジェクトの略称

要記述

## 基本的なインフラ

- `AWS`
- `Cloudflare`

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
特にできる限りCLIで簡潔に確認できるようにした上で,
確認用のコマンドと得られるべき結果を明記して`steps`ディレクトリに`日時-日付-step.md`に記録してください.

1. 今のコードベースで`CDK`コードを書き換え,
   指定した構成でAWSにデプロイして動作確認する。
2. `CDK`を修正して`dev`と`prod`版をリリースできるようにする.
3. npm workspace化する.
   workspace化してもローカル環境で元の動作が再現できるか確認する.
   `cdk deploy`の結果も変わらないか確認する.
4. `DynamoDB`のプロジェクトを作り、簡単な二種類のテーブルを作り、
   それらに対するCRUD操作とテストを書く。
5. `Hono`と`Remix`から`DynamoDB`を呼び出せるようにする。テストも書く。

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
