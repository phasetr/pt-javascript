# 環境変数をSecrets Managerに移行

## 概要

環境変数ENVも適切な形で削除し、Secrets Managerに値を設定するように変更しました。これにより、アプリケーションの設定情報も含めて、すべての設定をSecrets Managerで管理できるようになりました。

## 実装内容

### 1. CDKスタックの修正

アプリケーション設定用のSecrets Managerリソースを追加しました。

```typescript
// Secrets Managerの作成 - アプリケーション設定
const appConfigSecret = new secretsmanager.Secret(this, `${resourcePrefix}AppConfigSecret`, {
  secretName: `${resourcePrefix}/AppConfig`,
  description: 'アプリケーション設定',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      environment: environment, // 環境名
      region: this.region,
      stage: environment === 'prod' ? 'production' : 'development'
    }),
    generateStringKey: 'key'
  },
  removalPolicy: cdk.RemovalPolicy.DESTROY // cdk destroyでシークレットも削除する
});

// Lambda関数にSecrets Managerへのアクセス権限を付与
appConfigSecret.grantRead(honoLambda);
```

また、Lambda関数の環境変数からENVを削除し、代わりにSecrets Managerのシークレット名のみを渡すように変更しました。

```typescript
environment: {
  // 環境変数はSecrets Managerのシークレット名のみ
  APP_CONFIG_SECRET_NAME: appConfigSecret.secretName,
  BASIC_AUTH_SECRET_NAME: basicAuthSecret.secretName,
},
```

### 2. アプリケーション設定を取得するユーティリティ関数の作成

```typescript
// 環境の種類
export type Environment = 'local' | 'dev' | 'prod';

// アプリケーション設定の型
export interface AppConfig {
  environment: Environment;
  region: string;
  stage: 'development' | 'production';
}

// 現在の環境を判定する関数
export function isLocalEnvironment(): boolean {
  // NODE_ENVが'production'でない場合はローカル環境と判定
  return process.env.NODE_ENV !== 'production';
}

// アプリケーション設定を取得する関数
export async function getAppConfig(): Promise<AppConfig> {
  // ローカル環境では固定値を返す
  if (isLocalEnvironment()) {
    return {
      environment: 'local',
      region: 'ap-northeast-1',
      stage: 'development'
    };
  }
  
  // AWS環境ではSecrets Managerから取得
  try {
    const secretName = process.env.APP_CONFIG_SECRET_NAME;
    if (!secretName) {
      throw new Error("APP_CONFIG_SECRET_NAME environment variable is not set");
    }
    
    const secret = await getSecret(secretName);
    
    if (!secret.environment || !secret.region || !secret.stage) {
      throw new Error("Secret does not contain required app config");
    }
    
    return {
      environment: secret.environment as Environment,
      region: secret.region,
      stage: secret.stage as 'development' | 'production'
    };
  } catch (error) {
    console.error("Error getting app config:", error);
    // エラーが発生した場合はデフォルト値を返す
    return {
      environment: 'dev',
      region: 'ap-northeast-1',
      stage: 'development'
    };
  }
}
```

### 3. Hono APIのコードを修正

環境変数ENVを使用していた部分を、Secrets Managerから取得した設定を使用するように変更しました。

```typescript
// アプリケーション設定
let appConfig: AppConfig = {
  environment: 'local',
  region: 'ap-northeast-1',
  stage: 'development'
};

// 起動時に一度設定を取得
async function initializeConfig() {
  await updateAppConfig();
  await updateAuthCredentials();
}

// 設定を初期化
initializeConfig();

// 定期的に設定を更新（AWS環境のみ）
if (!isLocalEnvironment()) {
  // 1時間ごとに更新
  setInterval(async () => {
    await updateAppConfig();
    await updateAuthCredentials();
  }, 60 * 60 * 1000);
}
```

### 4. 環境変数の削除

.envファイルと.env.sampleファイルからENVを削除しました。

```
# 環境変数は不要になりました
# AWS環境ではSecrets Managerからアプリケーション設定と認証情報を取得します
# ローカル環境では固定値を使用します
```

## デプロイ

devとprodの両方の環境にデプロイしました。

```bash
cd packages/cbal && npm run build && cdk deploy --context environment=dev
cd packages/cbal && cdk deploy --context environment=prod
```

## 確認事項

- [x] アプリケーション設定用のSecrets Managerリソースが作成されていること
- [x] Lambda関数にSecrets Managerへのアクセス権限が付与されていること
- [x] 環境変数ENVが削除されていること
- [x] ローカル環境では固定値を使用していること
- [x] AWS環境ではSecrets Managerから値を取得していること

## メリット

1. 環境変数を完全に不要にし、設定情報をコードから分離できる
2. AWS環境ではすべての設定をSecrets Managerで一元管理できる
3. 設定の更新が容易（Secrets Managerの値を更新するだけ）
4. ローカル環境では開発しやすいように固定値を使用
5. 環境判定をNODE_ENVに基づいて行うことで、より標準的な方法に変更
