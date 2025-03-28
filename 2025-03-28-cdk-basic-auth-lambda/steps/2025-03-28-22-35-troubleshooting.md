# TypeScriptとコンパイル設定のトラブルシューティング

## 問題

CDK、Hono API、Remix、DBの構成でLambdaを使用する際のTypeScriptとコンパイル設定に統一感がなく、毎回混乱が生じていた。具体的には以下のような不統一な設定が存在していた：

1. **CDK**: CommonJS、ES2020ターゲット
2. **Hono API**: ESM、NodeNextモジュール、ESNextターゲット
3. **DB**: ESM、ESNextモジュール、bundlerモジュール解決
4. **Remix**: ESM、ESNextモジュール、Bundlerモジュール解決、types: ["@remix-run/node", "vite/client"]

## 調査手順

1. 現在のプロジェクト構成を分析するため、各パッケージの設定ファイルを確認

   ```bash
   cat package.json
   cat tsconfig.json
   cat packages/cbal/package.json
   cat packages/cbal/tsconfig.json
   cat packages/hono-api/package.json
   cat packages/hono-api/tsconfig.json
   cat packages/db/package.json
   cat packages/db/tsconfig.json
   cat packages/integration-tests/package.json
   cat packages/integration-tests/tsconfig.json
   ```

2. CDKスタックの実装を確認してLambda関数の定義方法を調査

   ```bash
   cat packages/cbal/lib/cbal-stack.ts
   ```

3. Hono APIの実装を確認

   ```bash
   cat packages/hono-api/src/index.ts
   cat packages/hono-api/src/app.ts
   ```

4. DBクライアントの実装を確認

   ```bash
   cat packages/db/src/client.ts
   ```

## 調査結果

1. **CDK**:
   - `package.json`: モジュール形式の指定なし（デフォルトでCommonJS）
   - `tsconfig.json`: CommonJSモジュール、ES2020ターゲット
   - AWS CDKはCommonJSを前提としている

2. **Hono API**:
   - `package.json`: ESMモジュール（`"type": "module"`）
   - `tsconfig.json`: NodeNextモジュール、ESNextターゲット
   - AWS Lambda用のハンドラをエクスポート

3. **DB**:
   - `package.json`: ESMモジュール（`"type": "module"`）
   - `tsconfig.json`: ESNextモジュール、bundlerモジュール解決
   - ルートのtsconfig.jsonを拡張

4. **Integration Tests**:
   - `package.json`: ESMモジュール（`"type": "module"`）
   - `tsconfig.json`: NodeNextモジュール、ES2022ターゲット

5. **Lambda関数のデプロイ**:
   - 現在はDockerイメージを使用してデプロイ

## 解決策

2025-03時点でのベストプラクティスとして、以下の設定を推奨：

### 1. モジュール形式の統一

**基本方針**:

- **CDK**: CommonJSを使用（AWS CDKの要件）
- **Lambda関数**: ESMを使用（最新のNode.js機能を活用）
- **共有ライブラリ**: デュアルパッケージ対応（ESM/CJS両対応）

### 2. パッケージ別の最適設定

#### CDKパッケージ

```json
// package.json
{
  "name": "cdk-app",
  "type": "commonjs",
  "scripts": {
    "build": "tsc"
  }
}
```

```json
// tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist"
  }
}
```

#### Lambda関数パッケージ（Hono API）

```json
// package.json
{
  "name": "hono-api",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json && cp package*.json dist/"
  }
}
```

```json
// tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist"
  }
}
```

#### 共有ライブラリパッケージ（DB）

```json
// package.json
{
  "name": "db",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "scripts": {
    "build": "npm run build:esm && npm run build:cjs && npm run build:types",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:cjs": "tsc -p tsconfig.cjs.json",
    "build:types": "tsc -p tsconfig.types.json"
  }
}
```

複数のtsconfig.jsonファイルを使用：

```json
// tsconfig.base.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

```json
// tsconfig.esm.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist/esm"
  }
}
```

```json
// tsconfig.cjs.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist/cjs"
  }
}
```

```json
// tsconfig.types.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist/types"
  }
}
```

### 3. Lambda関数のデプロイ方法

現在のDockerイメージ方式に加えて、NodejsFunction方式も選択肢として提示：

```typescript
// CDKスタック内
const honoLambda = new NodejsFunction(
  this,
  `${resourcePrefix}HonoFunction`,
  {
    entry: path.join(__dirname, "..", "..", "hono-api", "src", "index.ts"),
    functionName: `${resourcePrefix}HonoFunction`,
    handler: "handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    architecture: lambda.Architecture.ARM_64,
    memorySize: config.honoMemorySize,
    timeout: cdk.Duration.seconds(config.honoTimeout),
    bundling: {
      minify: true,
      sourceMap: true,
      target: "es2022",
      format: lambda.OutputFormat.ESM,
      externalModules: ["@aws-sdk/*"]
    },
    environment: {
      ENV: environment
    }
  }
);
```

## 移行手順

1. ルートの`tsconfig.json`を共通設定に更新
2. 各パッケージの`package.json`と`tsconfig.json`を更新
3. 共有ライブラリ（DB）をデュアルパッケージ形式に変換
4. ビルドスクリプトを更新
5. インポート文を必要に応じて更新（`.js`拡張子の追加など）

## 結論

2025-03時点では、CDKはCommonJS、Lambda関数はESM、共有ライブラリはデュアルパッケージという構成が最適。この構成により、各コンポーネントが最適な環境で動作しつつ、相互運用性も確保できる。

特に共有ライブラリのデュアルパッケージ対応は、異なるモジュール形式を使用するパッケージ間の連携を円滑にする重要な要素である。
