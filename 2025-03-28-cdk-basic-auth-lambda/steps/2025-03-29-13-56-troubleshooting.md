# pnpm deploy:devコマンドのエラー調査と修正

## 問題の概要

`pnpm deploy:dev`コマンドを実行すると、ビルドプロセス中にエラーが発生し、デプロイが失敗する問題が発生しました。

## 発生したエラー

Dockerビルド中に以下のエラーが発生しました：

```txt
npm ERR! code EUNSUPPORTEDPROTOCOL
npm ERR! Unsupported URL Type "workspace:": workspace:*
```

その後、以下のエラーも発生しました：

```txt
ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref 0a9c1c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c::0a9c1c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c: "/node_modules/aws-utils/package.json": not found
```

## 原因の調査

問題の原因を調査するために、以下のファイルを確認しました：

1. **package.json**: ルートのpackage.jsonを確認し、`deploy:dev`スクリプトの内容を確認
2. **scripts/prepare-deploy.js**: デプロイ準備スクリプトの内容を確認
3. **packages/hono-api/src/utils/secrets.ts**: aws-utilsパッケージのインポート方法を確認
4. **packages/hono-api/Dockerfile**: Dockerビルドプロセスを確認

調査の結果、以下の問題点が見つかりました：

1. hono-apiパッケージがaws-utilsパッケージを相対パスでインポートしていた

   ```typescript
   import { ... } from "../../../aws-utils/src/index.js";
   ```

2. hono-apiパッケージのpackage.jsonでは、aws-utilsパッケージを`workspace:*`として依存関係に指定していたが、Dockerビルド環境ではnpmを使用しており、この指定方法が理解できずエラーになっていた

3. prepare-deploy.jsスクリプトでは、dbパッケージのみをhono-apiのnode_modulesにコピーしており、aws-utilsパッケージはコピーしていなかった

4. hono-api/src/app.tsファイルでAppConfig型をインポートしていたが、secrets.tsファイルではAppConfig型を再エクスポートしていなかった

## 実施した修正

### 1. hono-api/src/utils/secrets.tsの修正

aws-utilsからインポートした型を再エクスポートし、相対パスインポートをパッケージ名インポートに変更しました：

```typescript
// 変更前
import {
  getEnvironment,
  isLocalEnvironment as isLocalEnv,
  getAppConfig as getConfig,
  getAuthCredentials,
  type Environment,
  type AppConfig,
} from "../../../aws-utils/src/index.js";

// 変更後
import {
  getEnvironment,
  isLocalEnvironment as isLocalEnv,
  getAppConfig as getConfig,
  getAuthCredentials,
  type Environment,
  type AppConfig,
} from "aws-utils";

// 型の再エクスポート
export type { AppConfig, Environment };
```

### 2. hono-api/tsconfig.jsonの修正

TypeScriptがaws-utilsモジュールを見つけられるように、pathsオプションを追加しました：

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": true,
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "outDir": "dist",
    "paths": {
      "aws-utils": ["../aws-utils/src/index.ts"],
      "aws-utils/*": ["../aws-utils/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 3. scripts/prepare-deploy.jsの修正

aws-utilsパッケージもhono-apiのnode_modulesにコピーするように修正しました：

```javascript
// 変更前
// Paths
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'packages', 'db');
const honoApiDir = path.join(rootDir, 'packages', 'hono-api');

// Create node_modules/@cbal directory if it doesn't exist
const honoApiNodeModulesDir = path.join(honoApiDir, 'node_modules', '@cbal');

if (!fs.existsSync(honoApiNodeModulesDir)) {
  fs.mkdirSync(honoApiNodeModulesDir, { recursive: true });
}

// Build db
console.log('Building db...');
execSync('pnpm --filter db build', { stdio: 'inherit' });

// Copy db to apps
console.log('Copying db to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesDir}/db`)) {
  execSync(`rm -rf ${honoApiNodeModulesDir}/db`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesDir}/db/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbDir}/dist/* ${honoApiNodeModulesDir}/db/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbDir}/package.json ${honoApiNodeModulesDir}/db/`, { stdio: 'inherit' });

// 変更後
// Paths
const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'packages', 'db');
const awsUtilsDir = path.join(rootDir, 'packages', 'aws-utils');
const honoApiDir = path.join(rootDir, 'packages', 'hono-api');

// Create node_modules directories if they don't exist
const honoApiNodeModulesCbalDir = path.join(honoApiDir, 'node_modules', '@cbal');
const honoApiNodeModulesDir = path.join(honoApiDir, 'node_modules');

if (!fs.existsSync(honoApiNodeModulesCbalDir)) {
  fs.mkdirSync(honoApiNodeModulesCbalDir, { recursive: true });
}

// Build packages
console.log('Building packages...');
execSync('pnpm --filter db build', { stdio: 'inherit' });
execSync('pnpm --filter aws-utils build', { stdio: 'inherit' });

// Copy db to hono-api
console.log('Copying db to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesCbalDir}/db`)) {
  execSync(`rm -rf ${honoApiNodeModulesCbalDir}/db`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesCbalDir}/db/dist`, { stdio: 'inherit' });
execSync(`cp -r ${dbDir}/dist/* ${honoApiNodeModulesCbalDir}/db/dist/`, { stdio: 'inherit' });
execSync(`cp ${dbDir}/package.json ${honoApiNodeModulesCbalDir}/db/`, { stdio: 'inherit' });

// Copy aws-utils to hono-api
console.log('Copying aws-utils to hono-api...');
// Clean up existing directories if they exist
if (fs.existsSync(`${honoApiNodeModulesDir}/aws-utils`)) {
  execSync(`rm -rf ${honoApiNodeModulesDir}/aws-utils`, { stdio: 'inherit' });
}
// Create directories and copy files
execSync(`mkdir -p ${honoApiNodeModulesDir}/aws-utils/dist`, { stdio: 'inherit' });
execSync(`cp -r ${awsUtilsDir}/dist/* ${honoApiNodeModulesDir}/aws-utils/dist/`, { stdio: 'inherit' });
execSync(`cp ${awsUtilsDir}/package.json ${honoApiNodeModulesDir}/aws-utils/`, { stdio: 'inherit' });
```

### 4. hono-api/Dockerfileの修正

aws-utilsの依存関係を除外し、aws-utilsパッケージをコピーする処理を追加しました：

```dockerfile
# 変更前
# Create a temporary package.json without the @cbal/db dependency
COPY package.json .
RUN cat package.json | grep -v "@cbal/db" > temp-package.json && \
    mv temp-package.json package.json

# 変更後
# Create a temporary package.json without the workspace dependencies
COPY package.json .
RUN cat package.json | grep -v "@cbal/db" | grep -v "aws-utils" > temp-package.json && \
    mv temp-package.json package.json
```

```dockerfile
# 変更前
# Create db directory and copy the compiled files
WORKDIR /app/node_modules/@cbal
RUN mkdir -p db/dist
WORKDIR /app
COPY ./node_modules/@cbal/db/dist ./node_modules/@cbal/db/dist
COPY ./node_modules/@cbal/db/package.json ./node_modules/@cbal/db/package.json

# 変更後
# Create directories and copy the compiled files
WORKDIR /app/node_modules/@cbal
RUN mkdir -p db/dist
WORKDIR /app/node_modules
RUN mkdir -p aws-utils/dist
WORKDIR /app
COPY ./node_modules/@cbal/db/dist ./node_modules/@cbal/db/dist
COPY ./node_modules/@cbal/db/package.json ./node_modules/@cbal/db/package.json
COPY ./node_modules/aws-utils/dist ./node_modules/aws-utils/dist
COPY ./node_modules/aws-utils/package.json ./node_modules/aws-utils/package.json
```

## 修正結果

上記の修正を適用した結果、`pnpm deploy:dev`コマンドが正常に実行され、デプロイが成功しました。

```txt
✅  CbalStack-dev

✨  Deployment time: 37.71s

Outputs:
CbalStack-dev.CBALdevApiEndpoint = https://tmpi104l8f.execute-api.ap-northeast-1.amazonaws.com/prod/
CbalStack-dev.CBALdevhonoApiEndpoint9C298BAB = https://tmpi104l8f.execute-api.ap-northeast-1.amazonaws.com/prod/
Stack ARN:
arn:aws:cloudformation:ap-northeast-1:573143736992:stack/CbalStack-dev/09ba1ce0-0bba-11f0-a945-068fd480577b

✨  Total time: 43.66s
```

## 教訓

1. モノレポ構成でパッケージ間の依存関係を変更する際は、ビルドスクリプトやデプロイスクリプトも適切に更新する必要がある
2. Dockerビルド環境ではpnpm固有の依存関係の指定方法（workspace:*）が使えないため、適切に対処する必要がある
3. TypeScriptの型定義の再エクスポートは、モジュール間の型の共有に重要である
4. 相対パスインポートよりもパッケージ名インポートの方が、ビルド環境の違いに強い
