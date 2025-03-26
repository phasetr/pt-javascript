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
2. pnpm workspace化する.
3. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
4. `CDK`を修正して`dev`と`prod`版をリリースできるようにする.
   workspace化してもローカル環境で元の動作が再現できるか確認する.
   `cdk deploy`の結果も変わらないか確認する.
5. `DynamoDB`のプロジェクトを作り、簡単な二種類のテーブルを作り、
   それらに対するCRUD操作とテストを書く。
6. `Hono`と`Remix`から`DynamoDB`を呼び出せるようにする。テストも書く。

### 自分用(都度消す)

```sh
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
mkdir -p packages/CIIC
cdk init sample-app --language typescript
```
