# .envファイルの削除とテストコードの修正

## 概要

.envファイルを削除し、テストコードを修正して、環境変数ENVを使わずに環境を判定するように変更しました。これにより、環境変数に依存せずにアプリケーションを実行できるようになりました。

## 実装内容

### 1. .envファイルの削除

以下のファイルを削除しました：

```bash
rm .env .env.sample packages/hono-api/.env packages/hono-api/.env.sample
```

### 2. テストコードの修正

#### 2.1. 環境判定の修正

`packages/integration-tests/src/config.ts`ファイルを修正して、環境変数ENVを使わずに環境を判定するようにしました：

```typescript
// Get current environment from NODE_ENV variable, default to 'local'
export const getEnvironment = (): Environment => {
  // コマンドライン引数から環境を取得
  const envArg = process.argv.find(arg => arg.startsWith('--env='));
  if (envArg) {
    const env = envArg.split('=')[1] as Environment;
    return env === 'dev' || env === 'prod' ? env : 'local';
  }
  
  // NODE_ENVから環境を判定
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // 本番環境の場合はprod
    return 'prod';
  }
  
  if (nodeEnv === 'development') {
    // 開発環境の場合はdev
    return 'dev';
  }
  
  // デフォルトはlocal
  return 'local';
};
```

#### 2.2. 認証情報の取得方法の修正

AWS環境では、Secrets Managerから認証情報を取得するように修正しました：

```typescript
// Get configuration for current environment
export const getConfig = async (): Promise<ApiConfig> => {
  const env = getEnvironment();
  
  // 環境に応じた認証情報を取得
  if (env === 'local') {
    // ローカル環境の場合は、認証情報を固定値に設定
    config[env].auth.username = 'dummy';
    config[env].auth.password = 'dummy';
  } else {
    // AWS環境の場合は、Secrets Managerから認証情報を取得
    try {
      const secretName = `CBAL-${env}/BasicAuth`;
      const client = new SecretsManagerClient({
        region: process.env.AWS_REGION || "ap-northeast-1",
      });
      
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });
      
      const response = await client.send(command);
      
      if (response.SecretString) {
        const secret = JSON.parse(response.SecretString);
        if (secret.username && secret.password) {
          config[env].auth.username = secret.username;
          config[env].auth.password = secret.password;
        }
      }
    } catch (error) {
      console.warn(`Failed to get auth credentials from Secrets Manager for ${env} environment:`, error);
      // Secrets Managerからの取得に失敗した場合はデフォルト値を使用
    }
    
    // AWS SDKを使ってAPIのURLを取得
    try {
      const stackName = `CbalStack-${env}`;
      const apiUrl = await getApiUrlFromCloudFormation(stackName);
      if (apiUrl) {
        config[env].baseUrl = apiUrl;
      }
    } catch (error) {
      console.warn(`Failed to get API URL from CloudFormation for ${env} environment:`, error);
      // CloudFormationからの取得に失敗した場合はデフォルト値を使用
    }
  }
  
  return config[env];
};
```

#### 2.3. テスト実行方法の修正

`packages/integration-tests/src/run-tests.ts`ファイルを修正して、環境変数ENVを使わずにテストを実行するようにしました：

```typescript
// Run tests with the specified environment
// NODE_ENVを設定してテストを実行
const nodeEnv = env === 'prod' ? 'production' : (env === 'dev' ? 'development' : 'test');
execSync(`NODE_ENV=${nodeEnv} npx vitest run --env=${env}`, { stdio: 'inherit' });
```

### 3. 必要なパッケージのインストール

Secrets Managerにアクセスするために必要なパッケージをインストールしました：

```bash
cd packages/integration-tests && pnpm add @aws-sdk/client-secrets-manager
```

## テスト結果

ローカル環境とdev環境でテストを実行し、正常に動作することを確認しました：

```bash
cd packages/integration-tests && node src/run-tests.ts --env=local
cd packages/integration-tests && node src/run-tests.ts --env=dev
```

## メリット

1. 環境変数に依存せずにアプリケーションを実行できる
2. 環境判定をコマンドライン引数とNODE_ENVに基づいて行うことで、より標準的な方法に変更
3. AWS環境では、Secrets Managerから認証情報を取得することで、セキュリティが向上
4. ローカル環境では、固定値を使用することで、開発効率を維持
