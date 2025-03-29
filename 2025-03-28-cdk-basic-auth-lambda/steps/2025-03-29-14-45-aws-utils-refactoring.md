# AWS関連処理のリファクタリング

## 概要

hono-apiのAWSに関わる処理をpackages/aws-utilsに移動し、コードの重複を減らしました。

## 変更内容

### 1. aws-utilsパッケージに新しい関数を追加

`packages/aws-utils/src/config.ts`に以下の関数と型を追加しました：

- `isLocalEnvironment()`: ローカル環境かどうかを判定する関数
- `getAppConfig()`: アプリケーション設定を取得する関数
- `AppConfig`型の定義

```typescript
/**
 * ローカル環境かどうかを判定する関数
 * NODE_ENVが'production'でない場合はローカル環境と判定
 * 
 * @param nodeEnv NODE_ENV環境変数の値
 * @returns ローカル環境かどうか
 */
export const isLocalEnvironment = (nodeEnv?: string): boolean => {
  // NODE_ENVが'production'でない場合はローカル環境と判定
  return nodeEnv !== "production";
};

/**
 * アプリケーション設定の型
 */
export interface AppConfig {
  environment: Environment;
  region: string;
  stage: "local" | "development" | "production";
}

/**
 * アプリケーション設定を取得する関数
 * 環境に応じた設定を返す
 * 
 * @param nodeEnv NODE_ENV環境変数の値
 * @param awsRegion AWSリージョン
 * @returns アプリケーション設定
 */
export const getAppConfig = (
  nodeEnv?: string,
  awsRegion = "ap-northeast-1"
): AppConfig => {
  const environment = getEnvironment(nodeEnv);

  // 環境に応じた設定を返す
  if (environment === "local") {
    return {
      environment: "local",
      region: "ap-northeast-1",
      stage: "local",
    };
  }

  if (environment === "dev") {
    return {
      environment: "dev",
      region: awsRegion,
      stage: "development",
    };
  }

  return {
    environment: "prod",
    region: awsRegion,
    stage: "production",
  };
};
```

### 2. aws-utilsパッケージのindex.tsを更新

`packages/aws-utils/src/index.ts`を更新して、新しく追加した関数をエクスポートしました：

```typescript
// 環境設定
export { 
  getEnvironment, 
  isLocalEnvironment, 
  getAppConfig, 
  type Environment, 
  type AppConfig 
} from "./config.js";
```

### 3. aws-utilsパッケージのテストを追加

`packages/aws-utils/src/config.test.ts`に新しく追加した関数のテストを追加しました：

```typescript
describe('isLocalEnvironment', () => {
  it('should return true when nodeEnv is not "production"', () => {
    expect(isLocalEnvironment('local')).toBe(true);
    expect(isLocalEnvironment('development')).toBe(true);
    expect(isLocalEnvironment('test')).toBe(true);
    expect(isLocalEnvironment(undefined)).toBe(true);
  });

  it('should return false when nodeEnv is "production"', () => {
    expect(isLocalEnvironment('production')).toBe(false);
  });
});

describe('getAppConfig', () => {
  it('should return local config when environment is local', () => {
    const config = getAppConfig('local');
    expect(config).toEqual({
      environment: 'local',
      region: 'ap-northeast-1',
      stage: 'local',
    });
  });

  it('should return dev config when environment is development', () => {
    const config = getAppConfig('development');
    expect(config).toEqual({
      environment: 'dev',
      region: 'ap-northeast-1',
      stage: 'development',
    });
  });

  it('should return prod config when environment is production', () => {
    const config = getAppConfig('production');
    expect(config).toEqual({
      environment: 'prod',
      region: 'ap-northeast-1',
      stage: 'production',
    });
  });

  it('should use custom region when provided', () => {
    const config = getAppConfig('production', 'us-west-2');
    expect(config).toEqual({
      environment: 'prod',
      region: 'us-west-2',
      stage: 'production',
    });
  });
});
```

### 4. hono-apiパッケージのsecrets.tsを更新

`packages/hono-api/src/utils/secrets.ts`を更新して、aws-utilsからインポートするように変更しました：

```typescript
import {
  getEnvironment,
  isLocalEnvironment as isLocalEnv,
  getAppConfig as getConfig,
  getAuthCredentials,
  type Environment,
  type AppConfig,
} from "../../../aws-utils/src/index.js";

// 現在の環境を判定する関数
export function isLocalEnvironment(): boolean {
  // aws-utilsのisLocalEnvironment関数を使用
  return isLocalEnv(process.env.NODE_ENV);
}

// 現在の環境を取得する関数
export function getCurrentEnvironment(): Environment {
  // aws-utilsのgetEnvironment関数を使用
  return getEnvironment(process.env.NODE_ENV);
}

// アプリケーション設定を取得する関数
export async function getAppConfig(): Promise<AppConfig> {
  // aws-utilsのgetAppConfig関数を使用
  return getConfig(process.env.NODE_ENV, process.env.AWS_REGION);
}

// Basic認証の認証情報を取得する関数
export async function getBasicAuthCredentials(): Promise<BasicAuthCredentials> {
  const environment = getCurrentEnvironment();

  // ローカル環境では固定値を返す
  if (environment === "local") {
    return {
      username: "dummy",
      password: "dummy",
    };
  }

  // AWS環境ではaws-utilsのgetAuthCredentials関数を使用
  try {
    const secretName = `CBAL-${environment}/BasicAuth`;
    const credentials = await getAuthCredentials(
      secretName,
      process.env.NODE_ENV,
      process.env.AWS_REGION || "ap-northeast-1"
    );
    
    return credentials;
  } catch (error) {
    console.warn("Failed to get auth credentials from Secrets Manager:", error);
    
    // Secrets Managerからの取得に失敗した場合はデフォルト値を使用
    return {
      username: "admin",
      password: "password",
    };
  }
}
```

### 5. integration-testsパッケージのテストを追加

`packages/integration-tests/src/aws-utils.test.ts`に新しく追加した関数のテストを追加しました：

```typescript
describe('Config', () => {
  it('should determine environment correctly', () => {
    // 環境を取得
    const env = getEnvironment(process.env.NODE_ENV);
    
    // 環境が有効な値であることを確認
    expect(['local', 'dev', 'prod']).toContain(env);
    
    console.log(`Current environment: ${env}`);
  });
});
```

## テスト結果

すべてのテストが正常に実行され、機能が正しく動作することを確認しました。

```txt
✓ src/config.test.ts (12)
✓ src/api.test.ts (6)
✓ src/lambda.test.ts (7)
✓ src/secrets.test.ts (12)
✓ src/cloudformation.test.ts (13)
```

```txt
✓ src/aws-utils.test.ts (7)
✓ src/todo-api.test.ts (5)
```

## まとめ

hono-apiのAWSに関わる処理をaws-utilsパッケージに移動し、コードの重複を減らすことができました。また、テストも追加して、機能が正しく動作することを確認しました。これにより、コードの保守性と再利用性が向上しました。
