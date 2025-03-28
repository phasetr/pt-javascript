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
    // AWS SDKを使って動的に取得するため、初期値はダミー
    baseUrl: 'https://dev-api.example.com', // この値は実際には使用されず、CloudFormationから取得される
    auth: {
      username: process.env.DEV_BASIC_USERNAME || '',
      password: process.env.DEV_BASIC_PASSWORD || '',
    },
  },
  prod: {
    // AWS SDKを使って動的に取得するため、初期値はダミー
    baseUrl: 'https://api.example.com', // この値は実際には使用されず、CloudFormationから取得される
    auth: {
      username: process.env.PROD_BASIC_USERNAME || '',
      password: process.env.PROD_BASIC_PASSWORD || '',
    },
  },
};

// AWS SDKを使ってAPIのURLを取得
import { getApiUrlFromCloudFormation } from './aws-utils.js';

// Get configuration for current environment
export const getConfig = async (): Promise<ApiConfig> => {
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
    
    // AWS SDKを使ってdev環境のAPIのURLを取得
    try {
      const stackName = process.env.DEV_STACK_NAME || 'CbalStack-dev';
      const apiUrl = await getApiUrlFromCloudFormation(stackName);
      if (apiUrl) {
        config[env].baseUrl = apiUrl;
      }
    } catch (error) {
      console.warn('Failed to get dev API URL from CloudFormation:', error);
      // CloudFormationからの取得に失敗した場合はデフォルト値を使用
    }
  } else if (env === 'prod') {
    // prod環境の場合は、PROD_BASIC_USERNAMEとPROD_BASIC_PASSWORDを使用
    config[env].auth.username = process.env.PROD_BASIC_USERNAME || '';
    config[env].auth.password = process.env.PROD_BASIC_PASSWORD || '';
    
    // AWS SDKを使ってprod環境のAPIのURLを取得
    try {
      const stackName = process.env.PROD_STACK_NAME || 'CbalStack-prod';
      const apiUrl = await getApiUrlFromCloudFormation(stackName);
      if (apiUrl) {
        config[env].baseUrl = apiUrl;
      }
    } catch (error) {
      console.warn('Failed to get prod API URL from CloudFormation:', error);
      // CloudFormationからの取得に失敗した場合はデフォルト値を使用
    }
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

// Get API URL for current environment
export const getApiUrl = async (): Promise<string> => {
  const env = getEnvironment();
  
  // ローカル環境の場合は設定ファイルのURLを使用
  if (env === 'local') {
    return config[env].baseUrl;
  }
  
  // dev/prod環境の場合はAWS SDKを使ってAPIのURLを取得
  try {
    const stackName = env === 'dev' 
      ? (process.env.DEV_STACK_NAME || 'CbalStack-dev')
      : (process.env.PROD_STACK_NAME || 'CbalStack-prod');
    
    const apiUrl = await getApiUrlFromCloudFormation(stackName);
    if (apiUrl) {
      // 取得したURLを設定に反映
      config[env].baseUrl = apiUrl;
      return apiUrl;
    }
  } catch (error) {
    console.warn(`Failed to get ${env} API URL from CloudFormation:`, error);
  }
  
  // CloudFormationからの取得に失敗した場合は設定ファイルのURLを使用
  return config[env].baseUrl;
};
