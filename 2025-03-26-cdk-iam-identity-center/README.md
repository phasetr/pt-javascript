# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

自分用備忘録：IAM Identity Center自体の理解をもっと深めないと何もわからないのがわかった。
現時点ではこれは忘れて、
このプロジェクトはLambda+DynamoDB+pnpm構成のサンプルとして対応する。
途中で嫌になったため、かなり半端なままで放置する。
`2025-03-25-cdk-two-lambda-dynamodb`を見ること.

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

1. (手動)：workspace内で`packages/CIIC`に`cdk init`する
2. (手動)：`packages/hono-api`に`Lambda`用の`Hono`を初期化しておく
3. pnpm workspace化する.
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. `Hono`で`DynamoDB`にアクセスする処理を書く
6. ローカル・AWS上の環境に対する結合テストを書く
7. `CDK`でこのプロジェクト用の`IAM Identity Center`アカウントを設定し、`CDK`で適切に権限を設定する
8. AWSへのデプロイ用コマンドをルートの`package.json`に設定する
9. ローカル・AWS上の開発環境に対する簡易結合テストを作成する。
   APIは全てを一通り叩いて結果が返るか確認する。
   環境指定で`local`・`dev`・`prod`を選べるようにし、適切な環境を指定して簡易結合テストできるようにする.
   この指定がない場合は自動的に`local`になるとする。
   現状のscriptsは本来db-libにまとめた方が良さそうなテーブル定義のinit-dynamodb,
   データのシーディングのseed-dataがある.
   各種データや処理が各所にばらけてしまうのはよくないため,
   まとめられるものはpackagesにまとめ,
   scriptsもpackagesの内容を読み込むようにしたい.
   必要ならscriptsディレクトリは廃止してpackagesの内容を読み込んで実行するappsにうつしたい.
   この（簡易）結合テストを簡潔に実行できるよう、ルートの`package.json`の`scripts`にコマンドを定義する。

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

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
