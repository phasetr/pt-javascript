import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

// Environment type
export type Environment = 'local' | 'dev' | 'prod';

// Get current environment from ENV variable, default to 'local'
export const getEnvironment = (): Environment => {
  const env = process.env.ENV as Environment;
  return env === 'dev' || env === 'prod' ? env : 'local';
};

// API configuration for different environments
interface ApiConfig {
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
  return config[env];
};
