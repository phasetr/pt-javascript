## Node.js

`Node.js`を利用する場合は原則として`pnpm`と`pnpm workspace`を利用する.
パフォーマンスの観点から`npm`は利用しない.

テストは`vitest`を利用する.

全パッケージに対する単体テスト・結合テスト,
アプリケーション系のパッケージの起動,
クラウド環境へのデプロイ・環境削除など重要なコマンドはルートの`package.json`にも記録する.

### AWS CDK+Lambda利用時のTypeScriptとコンパイル設定

CDK、Hono API、React Router、DBの構成でLambdaを使用する際のTypeScriptとコンパイル設定に統一感がなく、毎回混乱が生じていた。具体的には以下のような不統一な設定が存在していた：
2025-03時点でのベストプラクティスとして、以下の設定を推奨する.

#### 1. モジュール形式の統一

**基本方針**:

- **CDK**: CommonJSを使用（AWS CDKの要件）
- **Lambda関数**: ESMを使用（最新のNode.js機能を活用）
- **共有ライブラリ**: デュアルパッケージ対応（ESM/CJS両対応）

#### 2. パッケージ別の最適設定

ワークスペースルートの`tsconfig.json`を適切な共通設定とする.

##### CDKパッケージ

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

##### Lambda関数パッケージ（Hono API）

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

##### 共有ライブラリパッケージ（DB）

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

##### 3. Lambda関数のデプロイ方法

`Docker`イメージ方式に加えて、`NodejsFunction`方式も選択肢として提示：

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
