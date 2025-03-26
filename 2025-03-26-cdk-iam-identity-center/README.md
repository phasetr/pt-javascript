# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

IAM Identity Centerを利用したプロジェクト・環境ごとのアカウントをCDKで自動で作り,
プロジェクト・環境ごとに完全に権限が分離したアカウント運用ができるか調査・検討する.
プロジェクトはAWS Lambda+DynamoDBの構成で,
Lambdaはヘルスチェック用のルートへのアクセスと,
DynamoDBとの連携が確認できる登録・データ確認(CRUDのCRだけ)の口があればよい.
簡単に動作確認できるように,
実際に該当アカウントで余計なデータが見えないか,
AWS SDKで確認するスクリプトも作成する.

## プロジェクトの略称

CIIC(Cdk Iam Identity Center)

## 基本的なインフラ

- `AWS`

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切なjsまたはtsプログラム(jsまたはtsファイル)としてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`日時-日付-step.md`として記録してください.

1. (手動)：workspace内で`cdk init`する
2. (手動)：`packages/hono-api`に`Lambda`用の`Hono`を初期化しておく
3. pnpm workspace化する.
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. `Hono`で`DynamoDB`にアクセスする処理を書く
6. `CDK`でこのプロジェクト用の`IAM Identity Center`アカウントを設定し、`CDK`で適切に権限を設定する
7. AWSへのデプロイ用コマンドをルートの`package.json`に設定する
8. ローカル・AWS上の環境に対する結合テストを書く
9. 全体のテストコマンドをルートの`package.json`に設定する

### 自分用(都度消す)

```sh
corepack enable && corepack prepare pnpm@latest --activate
asdf reshim nodejs
pnpm -v
mkdir -p packages/CIIC
cd packages/CIIC
cdk init sample-app --language typescript
cd ../../
pnpm create hono@latest packages/hono-api
```
