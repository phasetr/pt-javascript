import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

// 環境の種類
export type Environment = 'local' | 'dev' | 'prod';

// アプリケーション設定の型
export interface AppConfig {
  environment: Environment;
  region: string;
  stage: 'development' | 'production';
}

// Basic認証の認証情報の型
export interface BasicAuthCredentials {
  username: string;
  password: string;
}

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

// Basic認証の認証情報を取得する関数
export async function getBasicAuthCredentials(): Promise<BasicAuthCredentials> {
  // ローカル環境では固定値を返す
  if (isLocalEnvironment()) {
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
