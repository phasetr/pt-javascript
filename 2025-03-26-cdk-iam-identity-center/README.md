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
特にできる限りCLIで簡潔に確認できるようにした上で,
確認用のコマンドと得られるべき結果を明記して`steps`ディレクトリに`日時-日付-step.md`に記録してください.

1. (手動)：workspace内で`cdk init`する
2. (手動)：`packages/hono-api`に`Lambda`用の`Hono`を初期化しておく
3. pnpm workspace化する.
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. `Hono`で`DynamoDB`にアクセスする処理を書く
6. ローカル・サーバーに対する結合テストを書く

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
