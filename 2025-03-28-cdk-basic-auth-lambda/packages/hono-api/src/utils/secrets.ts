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

// 現在の環境を判定する関数
export function isLocalEnvironment(): boolean {
  // NODE_ENVが'production'でない場合はローカル環境と判定
  return process.env.NODE_ENV !== 'production';
}

// アプリケーション設定を取得する関数
export async function getAppConfig(): Promise<AppConfig> {
  // ローカル環境では固定値を返す
  return {
    environment: 'local',
    region: 'ap-northeast-1',
    stage: 'development'
  };
}

// Basic認証の認証情報を取得する関数
export async function getBasicAuthCredentials(): Promise<BasicAuthCredentials> {
  // ローカル環境では固定値を返す
  return {
    username: 'dummy',
    password: 'dummy'
  };
}
