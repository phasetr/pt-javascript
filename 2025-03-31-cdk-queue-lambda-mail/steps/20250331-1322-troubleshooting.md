# Lambda関数の依存関係エラーのトラブルシューティング

## 問題

Lambda関数の実行時に以下のエラーが発生しました：

```txt
Error: Cannot find module '@smithy/config-resolver'
Require stack:
- /var/task/node_modules/@aws-sdk/client-ses/dist-cjs/index.js
- /var/task/dist/email.js
- /var/task/dist/index.js
- /var/runtime/index.mjs
```

これは、Lambda関数のデプロイパッケージに `@smithy/config-resolver` モジュールが含まれていないことが原因です。AWS SDK v3は、`@smithy` スコープのパッケージに依存しています。

## 原因

1. AWS SDK v3（`@aws-sdk/client-ses` など）は、`@smithy` スコープのパッケージに依存しています。
2. Lambda関数のデプロイパッケージには、これらの依存関係が含まれていませんでした。
3. CDKスタックの設定では、`packages/lambda` ディレクトリ全体をデプロイパッケージとして使用していましたが、ハンドラーは `dist/index.handler` と指定されていました。

## 解決策

以下の変更を行いました：

1. Lambda関数のpackage.jsonに `@smithy` スコープのパッケージを依存関係として追加
2. Lambda関数のビルドスクリプトを修正して、`dist` ディレクトリ内に必要な依存関係をインストールするように変更
3. CDKスタックの設定を修正して、`packages/lambda/dist` ディレクトリをデプロイパッケージとして使用するように変更

### 1. Lambda関数のpackage.jsonの修正

```json
{
  "dependencies": {
    "@aws-sdk/client-ses": "^3.540.0",
    "@aws-sdk/client-sqs": "^3.540.0",
    "@smithy/config-resolver": "^2.2.0",
    "@smithy/core": "^1.3.0",
    // 他の @smithy スコープのパッケージも追加
  }
}
```

### 2. Lambda関数のビルドスクリプトの修正

```bash
#!/bin/bash
set -e

# ... 既存のコード ...

# 本番環境用の依存関係をインストール
echo "Installing production dependencies..."
cd dist
npm init -y
npm install --save \
  @aws-sdk/client-ses@^3.540.0 \
  @aws-sdk/client-sqs@^3.540.0 \
  @smithy/config-resolver@^2.2.0 \
  @smithy/core@^1.3.0 \
  # 他の @smithy スコープのパッケージも追加
cd ..
```

### 3. CDKスタックの設定の修正

```typescript
// Lambda関数の作成
const emailLambda = new lambda.Function(this, "CqlmEmailLambda", {
  functionName: `${resourcePrefix}-EmailFunction`,
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "index.handler", // dist/ プレフィックスを削除
  code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/dist")), // dist ディレクトリを指定
  // ... 他のプロパティ ...
});
```

## 検証方法

1. 依存関係をインストールする

   ```bash
   pnpm run install:all
   ```

2. Lambda関数をビルドしてAWSにデプロイする

   ```bash
   pnpm run deploy:dev
   ```

3. 動作検証を行う

   ```bash
   pnpm run verify
   ```

4. CloudWatchログを確認して、エラーが解消されたことを確認する

## 学んだこと

1. AWS SDK v3は、`@smithy` スコープのパッケージに依存しています。
2. Lambda関数のデプロイパッケージには、すべての依存関係を含める必要があります。
3. CDKスタックの設定では、デプロイパッケージとハンドラーの指定を一致させる必要があります。
4. Lambda関数のビルドプロセスでは、本番環境用の依存関係のみをインストールすることで、デプロイパッケージのサイズを最小限に抑えることができます。
