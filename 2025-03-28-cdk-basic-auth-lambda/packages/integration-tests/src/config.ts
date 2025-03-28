import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Environment type
export type Environment = 'local' | 'dev' | 'prod';

// Get current environment from ENV variable, default to 'local'
export const getEnvironment = (): Environment => {
  const env = process.env.ENV as Environment;
  return env === 'dev' || env === 'prod' ? env : 'local';
};

// API configuration for different environments
export interface ApiConfig {
  baseUrl: string;
  auth: {
    username: string;
    password: string;
  };
}

// Configuration for different environments
const config: Record<Environment, ApiConfig> = {
  local: {
    baseUrl: 'http://localhost:3000',
    auth: {
      username: process.env.BASIC_USERNAME || 'dummy',
      password: process.env.BASIC_PASSWORD || 'dummy',
    },
  },
  dev: {
    baseUrl: process.env.DEV_API_URL || 'https://dev-api.example.com',
    auth: {
      username: process.env.DEV_BASIC_USERNAME || '',
      password: process.env.DEV_BASIC_PASSWORD || '',
    },
  },
  prod: {
    baseUrl: process.env.PROD_API_URL || 'https://api.example.com',
    auth: {
      username: process.env.PROD_BASIC_USERNAME || '',
      password: process.env.PROD_BASIC_PASSWORD || '',
    },
  },
};

// Get configuration for current environment
export const getConfig = (): ApiConfig => {
  const env = getEnvironment();
  
  // 環境に応じた認証情報を取得
  if (env === 'local') {
    // ローカル環境の場合は、認証情報を固定値に設定
    config[env].auth.username = 'dummy';
    config[env].auth.password = 'dummy';
  } else if (env === 'dev') {
    // dev環境の場合は、DEV_BASIC_USERNAMEとDEV_BASIC_PASSWORDを使用
    config[env].auth.username = process.env.DEV_BASIC_USERNAME || 'admin';
    config[env].auth.password = process.env.DEV_BASIC_PASSWORD || 'password';
  } else if (env === 'prod') {
    // prod環境の場合は、PROD_BASIC_USERNAMEとPROD_BASIC_PASSWORDを使用
    config[env].auth.username = process.env.PROD_BASIC_USERNAME || '';
    config[env].auth.password = process.env.PROD_BASIC_PASSWORD || '';
  }
  
  return config[env];
};

// Update API URL in config
export const updateApiUrl = (url: string): void => {
  const env = getEnvironment();
  if (env !== 'local') {
    config[env].baseUrl = url;
  }
};
