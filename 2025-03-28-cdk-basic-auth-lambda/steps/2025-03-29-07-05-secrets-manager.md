# AWS Secrets Managerを利用した認証情報の管理

## 概要

.envファイルを使わずにアプリケーションを開発するため、以下の方針で実装しました：

1. ローカル開発環境(local)では固定値をハードコーディング
2. AWS上の環境(dev,prod)ではSecrets Managerから値を取得

## 実装内容

### 1. CDKスタックの修正

AWS Secrets Managerリソースを追加し、Lambda関数にアクセス権限を付与しました。

```typescript
// Secrets Managerの作成
const basicAuthSecret = new secretsmanager.Secret(this, `${resourcePrefix}BasicAuthSecret`, {
  secretName: `${resourcePrefix}/BasicAuth`,
  description: 'Basic認証の認証情報',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      username: 'admin',
      password: 'password'
    }),
    generateStringKey: 'key'
  },
  removalPolicy: cdk.RemovalPolicy.DESTROY // cdk destroyでシークレットも削除する
});

// Lambda関数にSecrets Managerへのアクセス権限を付与
basicAuthSecret.grantRead(honoLambda);
```

### 2. Secrets Managerから認証情報を取得するユーティリティ関数の作成

```typescript
// Secrets Managerからシークレットを取得する関数
export async function getSecret(secretName: string): Promise<Record<string, string>> {
  const client = new SecretsManagerClient({});
  
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );
    
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    throw new Error("Secret string is empty");
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

// Basic認証の認証情報を取得する関数
export async function getBasicAuthCredentials(): Promise<{ username: string; password: string }> {
  // ローカル環境では固定値を返す
  if (process.env.ENV === 'local') {
    return {
      username: 'dummy',
      password: 'dummy'
    };
  }
  
  // AWS環境ではSecrets Managerから取得
  try {
    const secretName = process.env.BASIC_AUTH_SECRET_NAME;
    if (!secretName) {
      throw new Error("BASIC_AUTH_SECRET_NAME environment variable is not set");
    }
    
    const secret = await getSecret(secretName);
    
    if (!secret.username || !secret.password) {
      throw new Error("Secret does not contain username or password");
    }
    
    return {
      username: secret.username,
      password: secret.password
    };
  } catch (error) {
    console.error("Error getting basic auth credentials:", error);
    // エラーが発生した場合はデフォルト値を返す
    return {
      username: 'admin',
      password: 'password'
    };
  }
}
```

### 3. Hono APIのBasic認証設定の修正

```typescript
// 初期認証情報（起動時に使用）
let authCredentials = {
  username: process.env.ENV === 'local' ? 'dummy' : 'admin',
  password: process.env.ENV === 'local' ? 'dummy' : 'password'
};

// 認証情報を非同期で更新
async function updateAuthCredentials() {
  try {
    authCredentials = await getBasicAuthCredentials();
    console.log("Basic auth credentials updated");
  } catch (error) {
    console.error("Failed to update auth credentials:", error);
  }
}

// 起動時に一度認証情報を取得
updateAuthCredentials();

// 定期的に認証情報を更新（AWS環境のみ）
if (process.env.ENV !== 'local') {
  // 1時間ごとに更新
  setInterval(updateAuthCredentials, 60 * 60 * 1000);
}

// Basic認証の設定
app.use(
  "*",
  async (c, next) => {
    // リクエストごとに現在の認証情報を使用
    const auth = basicAuth({
      username: authCredentials.username,
      password: authCredentials.password,
    });
    return auth(c, next);
  }
);
```

### 4. 環境変数の設定

.envファイルを更新して、新しい環境変数の設定方法を示しました。

```
# ローカル環境設定
ENV=local

# 環境変数は不要になりました
# AWS環境ではSecrets Managerから認証情報を取得します
# ローカル環境では固定値を使用します
```

## デプロイ

devとprodの両方の環境にデプロイしました。

```bash
cd packages/cbal && npm run build && cdk deploy --context environment=dev
cd packages/cbal && cdk deploy --context environment=prod
```

## 確認事項

- [x] AWS Secrets Managerリソースが作成されていること
- [x] Lambda関数にSecrets Managerへのアクセス権限が付与されていること
- [x] ローカル環境では固定値を使用していること
- [x] AWS環境ではSecrets Managerから値を取得していること

## メリット

1. 環境変数を使わずに認証情報を管理できる
2. AWS環境では認証情報をSecrets Managerで一元管理できる
3. 認証情報の更新が容易（Secrets Managerの値を更新するだけ）
4. ローカル環境では開発しやすいように固定値を使用
