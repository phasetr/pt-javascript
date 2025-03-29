# 2025-03-29 19:33 - 統合テスト問題の解決

## 概要

`pnpm test:integration:dev`コマンドが失敗する問題を調査し、解決しました。問題は主に2つありました：

1. JSONデータのフォーマットが不正確だった問題
2. Lambda関数で必要なAWS SDKパッケージが不足していた問題

## 問題の詳細

### 1. JSONデータのフォーマット問題

APIリクエストに送信されるJSONデータに、キーと値のペアの間にカンマが欠けていました。

```json
// 不正な形式
{"userId":"test-user""title":"Test Todo""completed":false"dueDate":"2025-12-31"}

// 正しい形式
{"userId":"test-user","title":"Test Todo","completed":false,"dueDate":"2025-12-31"}
```

### 2. AWS SDK依存関係の問題

Lambda関数が起動時に以下のエラーで失敗していました：

```txt
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@aws-sdk/client-lambda' imported from /app/node_modules/aws-utils/dist/esm/lambda.js
```

これは、Lambda関数のDockerイメージに必要なAWS SDKパッケージが含まれていなかったことが原因でした。

### 3. Secrets Managerの問題

Secrets Managerに保存されている認証情報のJSONフォーマットが不正確でした：

```json
// 不正な形式
{"password":"password""username":"admin"}

// 正しい形式
{"password":"password","username":"admin"}
```

## 調査プロセス

1. まず、`pnpm test:integration:dev`コマンドを実行して、エラーの詳細を確認しました。
2. 最初のエラーは401 Unauthorizedでした。これは認証情報の問題を示唆していました。
3. APIクライアントのコードを調査し、JSONデータのフォーマットに問題があることを発見しました。
4. 認証情報の取得方法を調査し、Secrets Managerから取得していることを確認しました。
5. Lambda関数のログを確認し、`@aws-sdk/client-lambda`パッケージが見つからないエラーを発見しました。
6. Dockerfileを調査し、必要なAWS SDKパッケージが含まれていないことを確認しました。

## 解決策

### 1. AWS SDKパッケージの追加

Dockerfileに必要なAWS SDKパッケージを追加しました：

```dockerfile
# 変更前
RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-secrets-manager @aws-sdk/client-cloudformation @aws-sdk/util-dynamodb typescript

# 変更後
RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-secrets-manager @aws-sdk/client-cloudformation @aws-sdk/client-lambda @aws-sdk/util-dynamodb typescript
```

### 2. Secrets Managerの認証情報の修正

Secrets Managerに保存されている認証情報のJSONフォーマットを修正しました：

```bash
aws secretsmanager update-secret --secret-id CBAL-dev/BasicAuth --secret-string '{"password":"password","username":"admin"}'
```

## 検証

1. Lambda関数を再デプロイしました：

   ```bash
   pnpm deploy:dev
   ```

2. 統合テストを再実行して、すべてのテストが成功することを確認しました：

   ```bash
   pnpm test:integration:dev
   ```

## 学んだこと

1. **JSONフォーマットの重要性**: JSONデータのフォーマットが正確でないと、APIリクエストが失敗する可能性があります。特にカンマの欠落は見落としやすいエラーです。

2. **Lambda関数の依存関係管理**: Lambda関数が使用するすべての依存関係がDockerイメージに含まれていることを確認することが重要です。特にAWS SDKパッケージは、Lambda関数がAWSリソースにアクセスするために必要です。

3. **Secrets Managerの使用**: Secrets Managerに保存されている認証情報のフォーマットが正確であることを確認することが重要です。不正確なフォーマットは認証エラーの原因になります。

4. **エラーログの重要性**: Lambda関数のログを確認することで、問題の根本原因を特定することができました。エラーログは問題解決の重要な手がかりになります。

## 今後の改善点

1. **依存関係の自動検出**: プロジェクトで使用されているAWS SDKパッケージを自動的に検出し、Dockerfileに追加する仕組みを導入することで、同様の問題を防ぐことができます。

2. **JSONバリデーション**: APIリクエストのJSONデータをバリデーションする仕組みを導入することで、不正確なJSONフォーマットによるエラーを防ぐことができます。

3. **テスト環境の整備**: テスト環境を整備し、統合テストを定期的に実行することで、問題を早期に発見することができます。

4. **モニタリングの強化**: Lambda関数のエラーログを監視する仕組みを導入することで、問題を早期に発見することができます。
