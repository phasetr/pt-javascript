# 2025-03-29 19:37 - 統合テスト問題の詳細なトラブルシューティング

## 問題の概要

`pnpm test:integration:dev`コマンドが失敗し、APIとの接続ができない状態でした。エラーメッセージは以下の通りでした：

```txt
❌ API test failed: Error: HTTP error! status: 401
```

## 詳細な調査手順

### 1. 問題の再現と初期診断

まず、問題を再現するために`pnpm test:integration:dev`コマンドを実行しました。

```bash
pnpm test:integration:dev
```

最初のエラーは401 Unauthorized（認証エラー）でした。これは認証情報の問題を示唆していました。

### 2. Lambda関数のコード調査

次に、Lambda関数のコードを調査しました。特に`lambda.ts`ファイルに問題があることがわかりました：

```bash
cat packages/aws-utils/src/lambda.ts
```

このファイルには以下のような問題がありました：

1. インポート文に構文エラー：

   ```typescript
   import { LambdaClient GetFunctionCommand } from "@aws-sdk/client-lambda";
   ```

   カンマが欠けていました。正しくは：

   ```typescript
   import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
   ```

2. 関数のパラメータリストに構文エラー：

   ```typescript
   export async function getLambdaUrl(
     functionName?: string
     nodeEnv?: string
     region = "ap-northeast-1"
   ): Promise<string> {
   ```

   カンマが欠けていました。正しくは：

   ```typescript
   export async function getLambdaUrl(
     functionName?: string,
     nodeEnv?: string,
     region = "ap-northeast-1"
   ): Promise<string> {
   ```

3. エラーログ出力に構文エラー：

   ```typescript
   console.error("Error getting Lambda URL:" error);
   ```

   カンマが欠けていました。正しくは：

   ```typescript
   console.error("Error getting Lambda URL:", error);
   ```

### 3. Lambda関数のログ確認

Lambda関数のログを確認するために、以下のコマンドを実行しました：

```bash
aws logs get-log-events --log-group-name /aws/lambda/CBAL-devHonoDockerImageFunction --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/CBAL-devHonoDockerImageFunction --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text) --limit 20
```

ログから以下のエラーを発見しました：

```txt
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@aws-sdk/client-lambda' imported from /app/node_modules/aws-utils/dist/esm/lambda.js
```

これは、Lambda関数のDockerイメージに`@aws-sdk/client-lambda`パッケージが含まれていないことを示していました。

### 4. APIクライアントとSecretsの調査

APIクライアントのコードを調査しました：

```bash
cat packages/integration-tests/src/api-client.ts
```

また、認証情報の取得方法を調査しました：

```bash
cat packages/integration-tests/src/config.ts
cat packages/hono-api/src/utils/secrets.ts
cat packages/aws-utils/src/secrets.ts
```

Secrets Managerに保存されている認証情報を確認しました：

```bash
aws secretsmanager get-secret-value --secret-id CBAL-dev/BasicAuth
```

結果は以下の通りでした：

```json
{
    "ARN": "arn:aws:secretsmanager:ap-northeast-1:573143736992:secret:CBAL-dev/BasicAuth-cCo6l6",
    "Name": "CBAL-dev/BasicAuth",
    "VersionId": "5cfd63b7-af47-4c5e-87c0-99824b06abd0",
    "SecretString": "{\"password\":\"password\"\"username\":\"admin\"}",
    "VersionStages": [
        "AWSCURRENT"
    ],
    "CreatedDate": "2025-03-29T14:06:00.876000+09:00"
}
```

JSONフォーマットに問題があることがわかりました。キーと値のペアの間にカンマが欠けていました。

## 解決手順

### 1. Secrets Managerの認証情報の修正

Secrets Managerに保存されている認証情報のJSONフォーマットを修正しました：

```bash
aws secretsmanager update-secret --secret-id CBAL-dev/BasicAuth --secret-string '{"password":"password","username":"admin"}'
```

### 2. Lambda関数の再デプロイ

Lambda関数を再デプロイして、必要なAWS SDKパッケージを含めるようにしました：

```bash
pnpm deploy:dev
```

デプロイ中に、Dockerfileに`@aws-sdk/client-lambda`パッケージが追加されていることを確認しました：

```txt
[builder  7/19] RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-secrets-manager @aws-sdk/client-cloudformation @aws-sdk/client-lambda @aws-sdk/util-dynamodb typescript
```

### 3. 統合テストの再実行

統合テストを再実行して、問題が解決したことを確認しました：

```bash
pnpm test:integration:dev
```

すべてのテストが成功しました：

```txt
 ✓ src/aws-utils.test.ts (7) 572ms
 ✓ src/todo-api.test.ts (5) 2122ms

 Test Files  2 passed (2)
      Tests  12 passed (12)
   Start at  19:22:45
   Duration  2.58s
```

## 技術的な詳細

### 1. JSONフォーマットの問題

JSONデータのフォーマットに関する問題は、主に以下の2箇所で発生していました：

1. Secrets Managerに保存されている認証情報：

   ```json
   {"password":"password""username":"admin"}
   ```

2. APIリクエストに送信されるJSONデータ：

   ```json
   {"userId":"test-user""title":"Test Todo""completed":false"dueDate":"2025-12-31"}
   ```

どちらもキーと値のペアの間にカンマが欠けていました。

### 2. AWS SDK依存関係の問題

Lambda関数が使用する`@aws-sdk/client-lambda`パッケージがDockerイメージに含まれていませんでした。これは、`packages/hono-api/Dockerfile`で必要なパッケージをインストールする部分に問題がありました。

### 3. Lambda関数のコードの問題

`lambda.ts`ファイルには複数の構文エラーがありました。特にカンマの欠落が目立ちました。これらのエラーは、コードの実行時にエラーを引き起こす可能性がありました。

## 教訓と推奨事項

### 1. コード品質の向上

- **リンターの活用**: ESLintなどのリンターを活用して、構文エラーを早期に発見することが重要です。
- **型チェックの強化**: TypeScriptの型チェックを厳格にして、コンパイル時にエラーを発見することが重要です。

### 2. 依存関係管理の改善

- **依存関係の自動検出**: プロジェクトで使用されているAWS SDKパッケージを自動的に検出し、Dockerfileに追加する仕組みを導入することが推奨されます。
- **依存関係のバージョン管理**: 依存関係のバージョンを明示的に管理し、互換性の問題を防ぐことが重要です。

### 3. テスト戦略の改善

- **単体テストの強化**: 単体テストを強化して、コードの問題を早期に発見することが重要です。
- **統合テストの自動化**: 統合テストを自動化して、デプロイ前に問題を発見することが推奨されます。
- **テスト環境の整備**: テスト環境を整備して、本番環境に近い環境でテストすることが重要です。

### 4. モニタリングとログの改善

- **ログの強化**: ログを強化して、問題の診断を容易にすることが重要です。
- **モニタリングの導入**: モニタリングを導入して、問題を早期に発見することが推奨されます。
- **アラートの設定**: 重要なエラーに対してアラートを設定して、問題を迅速に対応することが重要です。

## 結論

今回の問題は、主にJSONフォーマットの問題とAWS SDK依存関係の問題でした。これらの問題は、コードの品質向上、依存関係管理の改善、テスト戦略の改善、モニタリングとログの改善によって防ぐことができます。

特に、JSONフォーマットの問題は見落としやすいため、リンターやバリデーションの導入が重要です。また、AWS SDK依存関係の問題は、依存関係の自動検出や明示的な管理によって防ぐことができます。
