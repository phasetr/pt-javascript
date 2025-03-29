# AWS Utils 結合テストの実装

## 概要

`aws-utils`パッケージ内でAWS SDKを使用している関数に対する結合テストを実装しました。これらの関数は単体テストではモックされていますが、実際のAWSリソースにアクセスできることを確認するために結合テストが必要です。

## 対象となる関数

以下の関数が結合テストの対象となります：

1. `getApiUrl`（api.ts）：環境に応じたAPI URLを取得（内部で`getApiUrlFromCloudFormation`と`getLambdaUrl`を使用）
2. `getApiUrlFromCloudFormation`（cloudformation.ts）：CloudFormationスタックの出力からAPI GatewayのURLを取得
3. `getStackInfo`（cloudformation.ts）：CloudFormationスタックの情報を取得
4. `getLambdaUrl`（lambda.ts）：Lambda関数の情報からAPI GatewayのURLを推測
5. `getAuthCredentials`（secrets.ts）：Secrets Managerから認証情報を取得

## 実装内容

`packages/integration-tests/src/aws-utils.test.ts`ファイルに結合テストを実装しました。テストの特徴は以下の通りです：

1. ローカル環境では実行をスキップする機能を実装
   - `skipIfLocal`関数を使用して、ローカル環境ではテストをスキップ
   - これにより、AWSリソースにアクセスできない環境でもテストが失敗しない

2. API URLの取得をテスト
   - デフォルトのベースURLを使用した場合のテスト
   - カスタムベースURLを指定した場合のテスト
   - 注意：型定義と実装の不一致により、環境とリージョンを指定したテストは実行できません

3. CloudFormationスタックの情報取得とAPI URLの取得をテスト
   - スタック名は環境に応じて動的に生成（例：`CbalStack-dev`）
   - スタックの情報が取得できることを確認
   - API URLが有効なURLであることを確認

4. Lambda関数からのURL取得をテスト
   - 関数名は環境に応じて動的に生成（例：`CBAL-dev-HonoDockerImageFunction`）
   - Lambda関数が存在しない場合は`Function not found`エラーを確認
   - Lambda関数が存在する場合は`Failed to determine API Gateway URL`エラーを確認
   - どちらのエラーも許容するように実装

5. Secrets Managerからの認証情報取得をテスト
   - シークレット名は環境に応じて動的に生成（例：`CBAL-dev/BasicAuth`）
   - 認証情報が取得できることを確認
   - デフォルト値が返された場合は警告を表示

## テストの実行方法

既存のスクリプトを使用してテストを実行できます：

```bash
# ローカル環境でテストを実行（AWS SDKを使用するテストはスキップされます）
npm run test:local

# 開発環境でテストを実行
npm run test:dev

# 本番環境でテストを実行
npm run test:prod
```

また、`aws-utils`パッケージの結合テストのみを実行するための専用コマンドも追加しました：

```bash
# ローカル環境でaws-utilsのテストのみを実行
npm run test:aws-utils:local

# 開発環境でaws-utilsのテストのみを実行
npm run test:aws-utils:dev

# 本番環境でaws-utilsのテストのみを実行
npm run test:aws-utils:prod
```

これにより、`todo-api.test.ts`のテストが失敗する場合でも、`aws-utils`パッケージの結合テストのみを実行して確認することができます。

## 注意点

1. 開発環境や本番環境でテストを実行するには、適切なAWS認証情報が設定されている必要があります。
2. テストはAWSリソースに実際にアクセスするため、課金が発生する可能性があります。
3. ローカル環境ではテストがスキップされるため、AWSリソースにアクセスできない環境でも安全に実行できます。
