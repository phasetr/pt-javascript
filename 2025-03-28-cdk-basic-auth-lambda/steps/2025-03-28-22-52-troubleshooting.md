# TypeScriptとコンパイル設定の統一化トラブルシューティング

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
   cat packages/hono-api/src/todos.ts
   ```

4. DBクライアントの実装を確認

   ```bash
   cat packages/db/src/client.ts
   ```

5. Dockerfileを確認

   ```bash
   cat packages/hono-api/Dockerfile
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
   - Dockerfileでのビルド時にtsconfig.jsonが見つからないエラーが発生

3. **DB**:
   - `package.json`: ESMモジュール（`"type": "module"`）
   - `tsconfig.json`: ESNextモジュール、bundlerモジュール解決
   - ルートのtsconfig.jsonを拡張
   - CDKからCommonJSとして、Hono APIからはESMとしてインポートされる必要がある

4. **Integration Tests**:
   - `package.json`: ESMモジュール（`"type": "module"`）
   - `tsconfig.json`: NodeNextモジュール、ES2022ターゲット

5. **ビルドエラー**:
   - CDKパッケージのビルド時に出力ファイルが入力ファイルを上書きするエラー
   - Dockerイメージビルド時にtsconfig.jsonが見つからないエラー
   - 異なるモジュール形式間の相互運用性の問題

## 解決策の実装

### 1. ルートの設定更新

```bash
# ルートのtsconfig.jsonを共通設定に更新
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out",
    "apps"
  ]
}
EOF
```

### 2. CDKパッケージの更新

```bash
# package.jsonにtype: commonjsを追加
sed -i '' 's/"name": "cbal",/"name": "cbal",\n  "type": "commonjs",/' packages/cbal/package.json

# tsconfig.jsonを更新
cat > packages/cbal/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": [
      "es2020",
      "dom"
    ],
    "outDir": "./build",
    "rootDir": ".",
    "inlineSourceMap": true,
    "inlineSources": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
EOF

# ビルドスクリプトを更新してクリーンビルドを実行
sed -i '' 's/"build": "tsc",/"build": "rm -rf build \&\& tsc",/' packages/cbal/package.json

# バイナリパスを更新
sed -i '' 's/"cbal": "bin\/cbal.js"/"cbal": "build\/bin\/cbal.js"/' packages/cbal/package.json
```

### 3. Hono APIパッケージの更新

```bash
# tsconfig.jsonを更新
cat > packages/hono-api/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": true,
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

# ビルドスクリプトを更新
sed -i '' 's/"build": "tsc/"build": "tsc -p tsconfig.json/' packages/hono-api/package.json

# Dockerfileを更新してtsconfig.jsonの問題を解決
cat > packages/hono-api/Dockerfile << 'EOF'
FROM public.ecr.aws/docker/library/node:20.9.0-slim AS builder
WORKDIR /app

# Create a temporary package.json without the @cbal/db dependency
COPY package.json .
RUN cat package.json | grep -v "@cbal/db" > temp-package.json && \
    mv temp-package.json package.json

# Copy and install dependencies
COPY package-lock.json .
RUN npm install
RUN npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb typescript

# Copy the rest of the app
COPY . .

# Create a minimal tsconfig.json file
RUN echo '{ "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "outDir": "dist", "esModuleInterop": true, "skipLibCheck": true } }' > /app/tsconfig.json

# Create db directory and copy the compiled files
WORKDIR /app/node_modules/@cbal
RUN mkdir -p db/dist
WORKDIR /app
COPY ./node_modules/@cbal/db/dist ./node_modules/@cbal/db/dist
COPY ./node_modules/@cbal/db/package.json ./node_modules/@cbal/db/package.json

# Build the app
RUN npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV PORT=3000
ENV AWS_LWA_READINESS_CHECK_PATH=/
ENV AWS_LWA_READINESS_CHECK_TIMEOUT=10000
WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Direct node execution
CMD ["node", "./dist/index.js"]
EOF
```

### 4. DBパッケージをデュアルパッケージ形式に変換

```bash
# 基本設定ファイルを作成
cat > packages/db/tsconfig.base.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
EOF

# ESM用の設定ファイル
cat > packages/db/tsconfig.esm.json << 'EOF'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist/esm",
    "sourceMap": true
  }
}
EOF

# CommonJS用の設定ファイル
cat > packages/db/tsconfig.cjs.json << 'EOF'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist/cjs",
    "sourceMap": true
  }
}
EOF

# 型定義用の設定ファイル
cat > packages/db/tsconfig.types.json << 'EOF'
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist/types"
  }
}
EOF

# メインのtsconfig.jsonを更新
cat > packages/db/tsconfig.json << 'EOF'
{
  "extends": "./tsconfig.base.json"
}
EOF

# package.jsonを更新してデュアルパッケージ対応に
sed -i '' 's/"main": "dist\/client.js",/"main": ".\/dist\/cjs\/client.js",\n  "module": ".\/dist\/esm\/client.js",\n  "types": ".\/dist\/types\/client.d.ts",/' packages/db/package.json
sed -i '' 's/"exports": {/"exports": {\n    ".": {\n      "import": ".\/dist\/esm\/client.js",\n      "require": ".\/dist\/cjs\/client.js",\n      "types": ".\/dist\/types\/client.d.ts"\n    },/' packages/db/package.json
sed -i '' 's/"build": "tsc"/"build": "npm run build:esm \&\& npm run build:cjs \&\& npm run build:types",\n    "build:esm": "tsc -p tsconfig.esm.json",\n    "build:cjs": "tsc -p tsconfig.cjs.json",\n    "build:types": "tsc -p tsconfig.types.json"/' packages/db/package.json

# DBクライアントのコードを更新（カンマの追加）
sed -i '' 's/docClient/docClient,/' packages/db/src/client.ts
sed -i '' 's/getTableName/getTableName,/' packages/db/src/client.ts
sed -i '' 's/getIndexName/getIndexName/' packages/db/src/client.ts
```

### 5. Integration Testsパッケージの更新

```bash
# tsconfig.jsonを更新
cat > packages/integration-tests/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

## 検証

1. ビルドの検証

   ```bash
   pnpm build
   ```

2. devステージへのデプロイ

   ```bash
   pnpm deploy:dev
   ```

3. ローカル環境での統合テスト

   ```bash
   pnpm local:start
   pnpm test:integration:local
   pnpm local:stop
   ```

4. dev環境での統合テスト

   ```bash
   pnpm test:integration:dev
   ```

## 結果

1. **ビルド**:
   - すべてのパッケージが正常にビルドできることを確認
   - CDKパッケージのビルドエラーを解決
   - Dockerイメージのビルドエラーを解決

2. **デプロイ**:
   - devステージへのデプロイが成功
   - Dockerイメージのビルドとデプロイが正常に完了

3. **統合テスト**:
   - ローカル環境での統合テストが成功
   - dev環境での統合テストが成功

## 結論

2025-03時点では、CDKはCommonJS、Lambda関数はESM、共有ライブラリはデュアルパッケージという構成が最適です。この構成により、各コンポーネントが最適な環境で動作しつつ、相互運用性も確保できます。

特に共有ライブラリのデュアルパッケージ対応は、異なるモジュール形式を使用するパッケージ間の連携を円滑にする重要な要素です。また、Dockerfileでのビルド時にtsconfig.jsonを明示的に作成することで、ビルドの安定性が向上しました。

今後新しいパッケージを追加する際は、用途に応じて適切なモジュール形式を選択し、共有ライブラリのインポート時は拡張子（.js）を含めることでESMの互換性を確保することを推奨します。
